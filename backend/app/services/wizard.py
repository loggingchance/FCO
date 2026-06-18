from app.models.schemas import WizardRequest, WizardRoute


def route_question(request: WizardRequest) -> WizardRoute:
    q = request.question.lower()
    geo = request.geography.lower()
    timeframe = request.timeframe.lower()
    data = request.data.lower()

    if "stand" in geo or "individual property" in geo or "future management" in timeframe or "management scenario" in q:
        return WizardRoute(
            module="FVS / FVS-ECON module",
            warning="FVS requires stand or representative-stand inputs. Do not treat FVS outputs as county FIA population estimates or regional employment impacts.",
            next_step="Open the FVS Scenario Lab and define variant, inventory, treatments, projection years, prices, costs, and discount rate.",
        )
    if "timber revenue" in q:
        return WizardRoute(
            module="FVS-ECON plus county timber sale data",
            warning="Treatment cash flow is not the same thing as regional employment, labor income, value added, or output.",
            next_step="Create a timber revenue scenario and connect reviewed direct activity to an economic impact model only when needed.",
        )
    if "economic impact" in q or "implan" in data or "rims" in data:
        return WizardRoute(
            module="Economic Impact module",
            warning="Distinguish contribution from impact and avoid double-counting direct activity.",
            next_step="Enter direct activity or import IMPLAN/RIMS II results with sector mapping and region notes.",
        )
    if "fiscal" in q or "tax" in q or "financial" in data:
        return WizardRoute(
            module="Fiscal and Tax module",
            warning="County fiscal outputs require local records and statute-specific interpretation.",
            next_step="Import county revenue, expense, tax, distribution, and management-cost templates.",
        )
    if "recreation" in q:
        return WizardRoute(
            module="Recreation Economy module",
            warning="Recreation economy estimates require use counts and spending assumptions; benchmarks alone are not a local study.",
            next_step="Import trail, campground, permit, visitor-day, and spending assumption data.",
        )
    if "water" in q or "air" in q or "habitat" in q or "hazard" in q or "climate" in q:
        return WizardRoute(
            module="Environmental Benefits module",
            warning="Use the right ecosystem-service or GIS tool for each benefit. Do not add values together unless they are explicitly non-overlapping.",
            next_step="Select the relevant adapter: EnviroAtlas, PAD-US, InVEST, WaSSI, Forests to Faucets, i-Tree, or FEMA NRI.",
        )
    if "stakeholder" in q or "survey" in data:
        return WizardRoute(
            module="Stakeholder Evidence module",
            warning="Qualitative evidence must be coded, tagged, and auditable.",
            next_step="Create interview or survey evidence records with tags, source notes, and review status.",
        )
    return WizardRoute(
        module="FIA / EVALIDator module",
        warning="County, state, and regional FIA estimates must not be interpreted as stand-level, parcel-level, or offset-ready results.",
        next_step="Use Explore Carbon or FIA Baseline to generate a broad-area current-stock estimate with sampling error notes.",
    )

