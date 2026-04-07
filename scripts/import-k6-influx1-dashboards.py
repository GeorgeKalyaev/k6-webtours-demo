#!/usr/bin/env python3
"""
Импорт дашбордов k6 с grafana.com для InfluxDB 1.x (InfluxQL).
ID: 2587, 24708, 14801, 19630 (без 19431 / Influx 2 + Flux).

После импорта вызывает fix-grafana-k6-dashboard-ds.py для всех новых uid
(подстановка ${DS_*}, интервалы '>1s').
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

GRAFANA_URL = os.environ.get("GRAFANA_URL", "http://localhost:3000")
GRAFANA_USER = os.environ.get("GRAFANA_USER", "admin")
GRAFANA_PASS = os.environ.get("GRAFANA_PASS", "admin")
DS_NAME = os.environ.get("K6_INFLUX_DS_NAME", "InfluxDB k6")

DASHBOARD_IDS = [2587, 24708, 14801, 19630]


def auth_header():
    import base64

    t = base64.b64encode(f"{GRAFANA_USER}:{GRAFANA_PASS}".encode()).decode()
    return {"Authorization": f"Basic {t}", "Content-Type": "application/json"}


def http_json(method, url, body=None):
    import urllib.request

    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=auth_header())
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def latest_revision(dashboard_id: int) -> int:
    """Максимальный номер ревизии; при 404 списка ревизий (старые/удалённые метаданные) — 1."""
    url = f"https://grafana.com/api/dashboards/{dashboard_id}/revisions"
    try:
        with urllib.request.urlopen(url) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return 1
        raise
    items = data.get("items") or []
    if not items:
        return 1
    return max(int(x["revision"]) for x in items)


def download_grafana_com(dashboard_id: int) -> dict:
    rev = latest_revision(dashboard_id)
    url = f"https://grafana.com/api/dashboards/{dashboard_id}/revisions/{rev}/download"
    with urllib.request.urlopen(url) as r:
        return json.load(r)


def build_import_body(pkg: dict) -> dict:
    inputs = []
    for inp in pkg.get("__inputs") or []:
        if inp.get("type") == "datasource" and inp.get("pluginId") == "influxdb":
            inputs.append(
                {
                    "name": inp["name"],
                    "type": "datasource",
                    "pluginId": "influxdb",
                    "value": DS_NAME,
                }
            )

    dash = dict(pkg)
    for k in ("__inputs", "__requires", "__elements"):
        dash.pop(k, None)
    for k in ("id", "version", "iteration"):
        dash.pop(k, None)

    return {
        "dashboard": dash,
        "overwrite": True,
        "inputs": inputs,
    }


def import_one(dashboard_id: int) -> dict:
    pkg = download_grafana_com(dashboard_id)
    body = build_import_body(pkg)
    return http_json("POST", f"{GRAFANA_URL}/api/dashboards/import", body)


def main():
    imported_uids = []
    summary = []

    for did in DASHBOARD_IDS:
        try:
            out = import_one(did)
            uid = out.get("uid")
            if uid:
                imported_uids.append(uid)
            summary.append(
                {
                    "gnetId": did,
                    "title": out.get("title"),
                    "uid": uid,
                    "url": out.get("importedUrl"),
                    "imported": out.get("imported"),
                }
            )
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            summary.append({"gnetId": did, "error": f"HTTP {e.code}: {err[:600]}"})

    if not imported_uids:
        print(json.dumps(summary, indent=2, ensure_ascii=True))
        return 1

    fix_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fix-grafana-k6-dashboard-ds.py")
    env = os.environ.copy()
    env["K6_DASH_UIDS"] = ",".join(imported_uids)
    r = subprocess.run([sys.executable, fix_script], env=env, check=False)

    print(json.dumps(summary, indent=2, ensure_ascii=True))
    return r.returncode


if __name__ == "__main__":
    sys.exit(main())
