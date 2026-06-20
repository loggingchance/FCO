from io import BytesIO
from html import escape
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from app.models.schemas import EstimateResponse


DISCLAIMER = (
    "FCO is an independent, unofficial, COLE-inspired tool. It is not affiliated "
    "with, endorsed by, sponsored by, or maintained by the USDA Forest Service, "
    "FIA, NCASI, the original COLE development group, or any prior COLE authors."
)


def _is_carbon(unit: str) -> bool:
    return "carbon" in unit.lower() and ("ton" in unit.lower() or "tonne" in unit.lower())


def _total(value: float, unit: str) -> str:
    return f"{value:,.0f}" if _is_carbon(unit) else f"{value:,.2f}"


def _per_acre(value: float, unit: str) -> str:
    return f"{value:,.1f}" if _is_carbon(unit) else f"{value:,.2f}"


def estimate_html(response: EstimateResponse) -> str:
    rows = "".join(
        f"<tr><td>{escape(row.label)}</td><td>{_total(row.total, row.unit)}</td><td>{_per_acre(row.per_acre, row.unit)}</td><td>{row.area_acres:,.2f}</td><td>{_total(row.standard_error, row.unit) if row.standard_error is not None else 'N/A'}</td><td>{f'{row.sampling_error_percent:.2f}%' if row.sampling_error_percent is not None else 'N/A'}</td><td>{row.plot_count if row.plot_count is not None else 'N/A'}</td></tr>"
        for row in response.rows
    )
    warnings = "".join(f"<li>{escape(warning)}</li>" for warning in response.warnings)
    return f"""<!doctype html>
<html><head><meta charset='utf-8'><title>FCO Report</title>
<style>body{{font-family:Arial,sans-serif;margin:40px;color:#18211b}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #d9e0d7;padding:8px;text-align:left}}.warn{{color:#a33b2e;font-weight:bold}}</style></head>
<body>
<h1>FCO Forest Carbon Report</h1>
<p><em>The COLE Tribute App</em></p>
<h2>{escape(response.headline.label)}</h2>
<p><strong>{_total(response.headline.value, response.headline.unit)} {escape(response.headline.unit)}</strong></p>
<p>Per acre: {_per_acre(response.headline.per_acre, response.headline.unit)} {escape(response.headline.unit)}/acre</p>
<h2>Results</h2>
<table><thead><tr><th>Label</th><th>Total</th><th>Per acre</th><th>Area acres</th><th>Standard error</th><th>Sampling error %</th><th>Plots</th></tr></thead><tbody>{rows}</tbody></table>
<h2>Plain-English interpretation</h2><p>This broad-area beta result is suitable for public education and workflow testing, not parcel-level or offset-ready accounting.</p>
<h2>Method and data source</h2><p>{escape(response.method_note)}</p><p>{escape(response.data_source)}</p>
<h2>Warnings</h2><ul class='warn'>{warnings}</ul>
<h2>COLE tribute note</h2><p>FCO honors the original COLE idea of making forest carbon inventory estimates easier to explore.</p>
<p class='warn'>{escape(DISCLAIMER)}</p>
</body></html>"""


def estimate_pdf(response: EstimateResponse) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("FCO Forest Carbon Report", styles["Title"]),
        Paragraph("The COLE Tribute App", styles["Italic"]),
        Spacer(1, 12),
        Paragraph(response.headline.label, styles["Heading2"]),
        Paragraph(f"{_total(response.headline.value, response.headline.unit)} {response.headline.unit}", styles["Heading3"]),
        Paragraph(f"Per acre: {_per_acre(response.headline.per_acre, response.headline.unit)} {response.headline.unit}/acre", styles["BodyText"]),
        Spacer(1, 12),
        Paragraph("Results", styles["Heading2"]),
        Table([["Label", "Total", "Per acre", "Area", "Std. error", "SE %", "Plots"]] + [[r.label, _total(r.total, r.unit), _per_acre(r.per_acre, r.unit), f"{r.area_acres:,.2f}", _total(r.standard_error, r.unit) if r.standard_error is not None else "N/A", f"{r.sampling_error_percent:.2f}%" if r.sampling_error_percent is not None else "N/A", r.plot_count if r.plot_count is not None else "N/A"] for r in response.rows]),
        Spacer(1, 12),
        Paragraph("Warnings", styles["Heading2"]),
    ]
    for warning in response.warnings:
        elements.append(Paragraph(warning, styles["BodyText"]))
    elements.extend([
        Spacer(1, 12),
        Paragraph("Method and limitations", styles["Heading2"]),
        Paragraph(response.method_note, styles["BodyText"]),
        Paragraph(DISCLAIMER, styles["BodyText"]),
    ])
    doc.build(elements)
    return buffer.getvalue()
