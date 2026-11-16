"""
Servidor Backend para el Geoportal DELTA CLUB – VIVO AMPAY (UNAJMA)
Conecta de forma segura con Google Earth Engine (earthengine-api) sin exponer
credenciales privadas en el navegador y entrega series en el formato de 14 columnas.

Ejecución en Windows / Linux / macOS:
    python server/app.py
"""

from __future__ import annotations
import csv
import io
import json
import math
import os
import sys
import webbrowser
from datetime import datetime, timezone
from pathlib import Path
from threading import Timer
from uuid import uuid4
from flask import Flask, jsonify, request, send_from_directory, url_for
from PIL import Image, UnidentifiedImageError

try:
    from flask_cors import CORS
except ImportError:
    CORS = None

try:
    import ee
    HAS_EE = True
except ImportError:
    HAS_EE = False

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
PHOTO_DIR = ROOT_DIR / "fotografias"
PHOTO_LIMIT = 20 * 1024 * 1024
PHOTO_EXTENSIONS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}

DEFAULT_PROJECT_ID = os.environ.get("GEE_PROJECT_ID", "wise-brook-514714-p4")
DEFAULT_ASSET_ID = os.environ.get(
    "GEE_ASSET_ID", "projects/wise-brook-514714-p4/assets/tamburco_glaciar"
)

PUBLIC_DIR = ROOT_DIR / "public"

app = Flask(
    __name__,
    static_folder=str(PUBLIC_DIR),
    static_url_path=""
)
if CORS:
    CORS(app)

EE_STATUS = {
    "initialized": False,
    "project_id": DEFAULT_PROJECT_ID,
    "asset_id": DEFAULT_ASSET_ID,
    "error": None
}


def try_init_ee(project_id: str = DEFAULT_PROJECT_ID) -> bool:
    if not HAS_EE:
        EE_STATUS["initialized"] = False
        EE_STATUS["error"] = "earthengine-api no está instalado (pip install earthengine-api)"
        return False
    try:
        ee.Initialize(project=project_id)
        EE_STATUS["initialized"] = True
        EE_STATUS["project_id"] = project_id
        EE_STATUS["error"] = None
        return True
    except Exception as exc:
        EE_STATUS["initialized"] = False
        EE_STATUS["error"] = str(exc)
        return False


def load_local_csv(filename: str = "observations_ampay.csv") -> list[dict]:
    csv_path = DATA_DIR / filename
    if not csv_path.exists():
        return []
    rows = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            val_str = r.get("valor", "")
            try:
                val = float(val_str) if val_str not in ("", None) else None
                if val is not None and not math.isfinite(val):
                    val = None
            except ValueError:
                val = None
            rows.append({
                "fecha": r.get("fecha", ""),
                "zona_id": r.get("zona_id", "AMPAY"),
                "variable": r.get("variable", ""),
                "valor": val,
                "unidad": r.get("unidad", ""),
                "estadistico": r.get("estadistico", ""),
                "sensor": r.get("sensor", ""),
                "fuente": r.get("fuente", ""),
                "coleccion": r.get("coleccion", ""),
                "resolucion_m": float(r["resolucion_m"]) if r.get("resolucion_m") else None,
                "n_observaciones": float(r["n_observaciones"]) if r.get("n_observaciones") else 0,
                "cobertura_valida_pct": float(r["cobertura_valida_pct"]) if r.get("cobertura_valida_pct") else None,
                "calidad": r.get("calidad", "ALTA"),
                "periodo_completo": str(r.get("periodo_completo", "True")).lower() in ("true", "1", "si", "sí")
            })
    return rows


@app.route("/")
def serve_index():
    return send_from_directory(str(PUBLIC_DIR), "index.html")


def photo_record(metadata: dict) -> dict:
    return {
        "id": metadata["id"],
        "title": metadata["title"],
        "sector": metadata["sector"],
        "date": metadata["date"],
        "img": url_for("static", filename=f"fotografias/{metadata['filename']}"),
    }


@app.get("/api/fotografias")
def list_photos():
    photos = []
    for path in PHOTO_DIR.glob("*.json"):
        try:
            metadata = json.loads(path.read_text(encoding="utf-8"))
            filename = metadata["filename"]
            if Path(filename).name == filename and (PHOTO_DIR / filename).is_file():
                photos.append(metadata)
        except (OSError, ValueError, KeyError, TypeError):
            continue
    photos.sort(key=lambda photo: photo.get("created_at", ""), reverse=True)
    return jsonify({"photos": [photo_record(photo) for photo in photos]})


@app.post("/api/fotografias")
def save_photo():
    origin = request.headers.get("Origin")
    if origin and origin != request.host_url.rstrip("/"):
        return jsonify({"error": "origin"}), 403
    request.max_content_length = PHOTO_LIMIT + 64 * 1024
    incoming = request.files.get("photo")
    if incoming is None:
        return jsonify({"error": "file_required"}), 400
    content = incoming.stream.read(PHOTO_LIMIT + 1)
    if len(content) > PHOTO_LIMIT:
        return jsonify({"error": "too_large"}), 413
    try:
        with Image.open(io.BytesIO(content)) as image:
            extension = PHOTO_EXTENSIONS.get(image.format)
            if extension is None or image.width * image.height > 50_000_000:
                return jsonify({"error": "invalid_image"}), 400
            image.verify()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        return jsonify({"error": "invalid_image"}), 400

    photo_id = uuid4().hex
    now = datetime.now(timezone.utc)
    date = request.form.get("date", "")
    try:
        date = datetime.strptime(date, "%Y-%m-%d").date().isoformat()
    except ValueError:
        date = now.date().isoformat()
    metadata = {
        "id": photo_id,
        "filename": f"{photo_id}.{extension}",
        "title": request.form.get("title", "").strip()[:140] or "Monitoreo Santuario de Ampay",
        "sector": request.form.get("sector", "").strip()[:180],
        "date": date,
        "created_at": now.isoformat(),
    }
    image_path = PHOTO_DIR / metadata["filename"]
    metadata_path = PHOTO_DIR / f"{photo_id}.json"
    pending_image = PHOTO_DIR / f".{photo_id}.image"
    pending_metadata = PHOTO_DIR / f".{photo_id}.metadata"
    try:
        PHOTO_DIR.mkdir(parents=True, exist_ok=True)
        pending_image.write_bytes(content)
        pending_metadata.write_text(json.dumps(metadata, ensure_ascii=False), encoding="utf-8")
        pending_image.replace(image_path)
        pending_metadata.replace(metadata_path)
    except OSError:
        for path in (pending_image, pending_metadata, image_path):
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass
        app.logger.exception("Error al guardar una fotografía en %s", PHOTO_DIR)
        return jsonify({"error": "write_failed"}), 500
    return jsonify(photo_record(metadata)), 201


@app.route("/api/status", methods=["GET"])
def api_status():
    project_id = request.args.get("project_id", EE_STATUS["project_id"])
    if not EE_STATUS["initialized"]:
        try_init_ee(project_id)
    local_rows = load_local_csv()
    return jsonify({
        "status": "ok",
        "mode": "online" if EE_STATUS["initialized"] else "local_contingency",
        "gee_initialized": EE_STATUS["initialized"],
        "project_id": EE_STATUS["project_id"],
        "asset_id": EE_STATUS["asset_id"],
        "gee_error": EE_STATUS["error"],
        "local_observations": len(local_rows),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@app.route("/api/observations", methods=["GET"])
def api_observations():
    """Devuelve las observaciones en el esquema obligatorio de 14 columnas."""
    rows = load_local_csv()
    variable = request.args.get("variable")
    zona_id = request.args.get("zona_id")
    if variable:
        rows = [r for r in rows if r["variable"] == variable]
    if zona_id:
        rows = [r for r in rows if r["zona_id"] == zona_id]
    return jsonify({
        "mode": "online" if EE_STATUS["initialized"] else "local",
        "count": len(rows),
        "columns": [
            "fecha", "zona_id", "variable", "valor", "unidad", "estadistico",
            "sensor", "fuente", "coleccion", "resolucion_m", "n_observaciones",
            "cobertura_valida_pct", "calidad", "periodo_completo"
        ],
        "records": rows
    })


@app.route("/api/gee/compute", methods=["POST"])
def api_gee_compute():
    """
    Consulta Google Earth Engine en vivo para calcular una serie mensual estandarizada
    (14 columnas) sobre el asset del Santuario Nacional de Ampay / Tamburco.
    """
    payload = request.get_json(silent=True) or {}
    project_id = payload.get("project_id", EE_STATUS["project_id"])
    asset_id = payload.get("asset_id", EE_STATUS["asset_id"])
    variable = payload.get("variable", "NDVI").upper()
    start_date = payload.get("start_date", "2024-01-01")
    end_date = payload.get("end_date", "2026-11-01")

    if not EE_STATUS["initialized"] and not try_init_ee(project_id):
        return jsonify({
            "ok": False,
            "fallback": "local",
            "message": f"GEE no autenticado ({EE_STATUS['error']}). Usando base local de contingencia.",
            "records": load_local_csv()
        }), 200

    try:
        aoi = ee.FeatureCollection(asset_id)
        region = aoi.geometry()
        s2_sr = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lte("CLOUDY_PIXEL_PERCENTAGE", 10))
        )

        def compute_index(img):
            scl = img.select("SCL")
            valid_mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
            clean = img.updateMask(valid_mask)
            if variable == "NDVI":
                val = clean.normalizedDifference(["B8", "B4"]).rename("val")
            elif variable == "SAVI":
                val = clean.expression(
                    "1.5 * ((NIR - RED) / (NIR + RED + 0.5))",
                    {"NIR": clean.select("B8").multiply(0.0001), "RED": clean.select("B4").multiply(0.0001)}
                ).rename("val")
            elif variable == "NDMI":
                val = clean.normalizedDifference(["B8", "B11"]).rename("val")
            elif variable == "EVI":
                val = clean.expression(
                    "2.5 * ((NIR - RED) / (NIR + 6.0 * RED - 7.5 * BLUE + 1.0))",
                    {
                        "NIR": clean.select("B8").multiply(0.0001),
                        "RED": clean.select("B4").multiply(0.0001),
                        "BLUE": clean.select("B2").multiply(0.0001)
                    }
                ).rename("val")
            elif variable == "NDSI":
                val = clean.normalizedDifference(["B3", "B11"]).rename("val")
            else:
                val = clean.normalizedDifference(["B3", "B11"]).rename("val")
            return val.copyProperties(img, ["system:time_start"])

        indexed = s2_sr.map(compute_index)
        start_ee = ee.Date(start_date)
        end_ee = ee.Date(end_date)
        n_months = end_ee.difference(start_ee, "month").round()
        months = ee.List.sequence(0, n_months.subtract(1))

        def per_month(m):
            m_start = start_ee.advance(m, "month")
            m_end = m_start.advance(1, "month")
            col_m = indexed.filterDate(m_start, m_end)
            count = col_m.size()
            mean_img = ee.Image(ee.Algorithms.If(count.gt(0), col_m.mean(), ee.Image.constant(0).updateMask(0).rename("val")))
            stats = mean_img.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region,
                scale=20,
                maxPixels=1e13
            )
            return ee.Feature(None, {
                "fecha": m_start.format("YYYY-MM-01"),
                "valor": stats.get("val"),
                "n_observaciones": count
            })

        fc = ee.FeatureCollection(months.map(per_month)).getInfo()
        records = []
        for feat in fc.get("features", []):
            props = feat.get("properties", {})
            val = props.get("valor")
            n_obs = int(props.get("n_observaciones", 0))
            records.append({
                "fecha": props.get("fecha"),
                "zona_id": "AMPAY",
                "variable": variable,
                "valor": round(float(val), 4) if val is not None else None,
                "unidad": "adimensional",
                "estadistico": "mediana_temporal_media_espacial",
                "sensor": "Sentinel-2",
                "fuente": "Copernicus / GEE Live",
                "coleccion": "COPERNICUS/S2_SR_HARMONIZED",
                "resolucion_m": 10 if variable in ("NDVI", "SAVI", "EVI") else 20,
                "n_observaciones": n_obs,
                "cobertura_valida_pct": 100.0 if val is not None else 0.0,
                "calidad": "ALTA" if val is not None else "SIN_DATOS",
                "periodo_completo": True
            })
        return jsonify({"ok": True, "mode": "online", "variable": variable, "records": records})
    except Exception as exc:
        return jsonify({
            "ok": False,
            "fallback": "local",
            "message": str(exc),
            "records": [r for r in load_local_csv() if r["variable"] == variable]
        }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    url = f"http://127.0.0.1:{port}"
    print(f"=== Geoportal DELTA CLUB - VIVO AMPAY v4 en {url} ===", flush=True)
    if "--open" in sys.argv:
        browser = Timer(1.0, webbrowser.open, args=(url,))
        browser.daemon = True
        browser.start()
    app.run(host="127.0.0.1", port=port, debug=False)
