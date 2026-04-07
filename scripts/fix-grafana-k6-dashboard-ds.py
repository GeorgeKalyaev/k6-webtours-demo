#!/usr/bin/env python3
"""Fix k6 Grafana dashboards: ${DS_*} → InfluxDB datasource uid; legacy panel interval '>1s' → '1s'."""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

GRAFANA_URL = os.environ.get("GRAFANA_URL", "http://localhost:3000")
GRAFANA_USER = os.environ.get("GRAFANA_USER", "admin")
GRAFANA_PASS = os.environ.get("GRAFANA_PASS", "admin")
DS_NAME = os.environ.get("K6_INFLUX_DS_NAME", "InfluxDB k6")
DEFAULT_UID = os.environ.get("K6_DASH_UID", "1c071ad3-612f-4494-92c1-ab0bda38bc37")

_DS_PLACEHOLDER = re.compile(r"^\$\{DS_[^}]+\}$")


def auth_header():
    token = base64.b64encode(f"{GRAFANA_USER}:{GRAFANA_PASS}".encode()).decode()
    return {"Authorization": f"Basic {token}", "Content-Type": "application/json"}


def http_json(method, url, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=auth_header())
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def fix_legacy_interval(obj):
    if isinstance(obj, dict):
        iv = obj.get("interval")
        if isinstance(iv, str) and iv.startswith(">"):
            obj["interval"] = iv.lstrip(">").strip() or "1s"
        for v in obj.values():
            fix_legacy_interval(v)
    elif isinstance(obj, list):
        for x in obj:
            fix_legacy_interval(x)


def fix_datasource(obj, ds_uid: str):
    if isinstance(obj, dict):
        ds = obj.get("datasource")
        if isinstance(ds, str) and _DS_PLACEHOLDER.match(ds):
            obj["datasource"] = {"type": "influxdb", "uid": ds_uid}
        for v in obj.values():
            fix_datasource(v, ds_uid)
    elif isinstance(obj, list):
        for x in obj:
            fix_datasource(x, ds_uid)


def resolve_uids():
    raw = os.environ.get("K6_DASH_UIDS", "").strip()
    if raw:
        return [u.strip() for u in raw.split(",") if u.strip()]
    return [DEFAULT_UID]


def fix_one_dashboard(dash_uid: str) -> dict:
    ds = http_json(
        "GET",
        f"{GRAFANA_URL}/api/datasources/name/{urllib.parse.quote(DS_NAME, safe='')}",
    )
    ds_uid = ds["uid"]

    payload = http_json("GET", f"{GRAFANA_URL}/api/dashboards/uid/{dash_uid}")
    dash = payload["dashboard"]

    fix_datasource(dash, ds_uid)
    fix_legacy_interval(dash)

    out = http_json(
        "POST",
        f"{GRAFANA_URL}/api/dashboards/db",
        {
            "dashboard": dash,
            "overwrite": True,
            "message": "Fix k6 dashboard: ${DS_*} + interval >1s",
        },
    )
    return {
        "status": "ok",
        "uid": out.get("uid"),
        "url": out.get("url"),
        "title": dash.get("title"),
    }


def main():
    uids = resolve_uids()
    results = []
    for u in uids:
        try:
            results.append(fix_one_dashboard(u))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:800]
            results.append({"status": "error", "uid": u, "http": e.code, "body": body})
    print(json.dumps(results, indent=2, ensure_ascii=True))
    return 0 if all(r.get("status") == "ok" for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
