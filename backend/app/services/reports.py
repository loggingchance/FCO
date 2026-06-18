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


def estimate_html(response: EstimateResponse) -> str:
    rows = "".join(
        f"<tr><td>{escape(row.label)}</td><td>{row.total:,.2f}</td><td>{row.per_acre:,.2f}</td><td>{row.area_acres:,.2f}</td><td>{row.sampling_error_percent or 'N/A'}</td></tr>"
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
<p><strong>{response.headline.value:,.2f} {escape(response.headline.unit)}</strong></p>
<p>Per acre: {response.headline.per_acre:,.2f} {escape(response.headline.unit)}/acre</p>
<h2>Results</h2>
<table><thead><tr><th>Label</th><th>Total</th><th>Per acre</th><th>Area acres</th><th>Sampling error %</th></tr></thead><tbody>{rows}</tbody></table>
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
        Paragraph(f"{response.headline.value:,.2f} {response.headline.unit}", styles["Heading3"]),
        Paragraph(f"Per acre: {response.headline.per_acre:,.2f} {response.headline.unit}/acre", styles["BodyText"]),
        Spacer(1, 12),
        Paragraph("Results", styles["Heading2"]),
        Table([["Label", "Total", "Per acre", "Area acres", "SE %"]] + [[r.label, f"{r.total:,.2f}", f"{r.per_acre:,.2f}", f"{r.area_acres:,.2f}", r.sampling_error_percent or "N/A"] for r in response.rows]),
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

