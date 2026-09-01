import { ParsedMorawareData, ParsedPdfData } from '../types';

export const SAMPLE_HTML_RESIDENTIAL = `
<!DOCTYPE html>
<html>
<head><title>Job Detail - Moraware</title></head>
<body>
  <div class="jobHeader">
    <table class="pageInfoCenteredJustifiedTable">
      <tr>
        <td class="pageInfoLabel">● Job Name:</td>
        <td class="pageInfoValue">● HENDERSON RESIDENCE</td>
        <td class="pageInfoLabel">● Job #:</td>
        <td class="pageInfoValue">● J26-104</td>
      </tr>
      <tr>
        <td class="pageInfoLabel">● Account:</td>
        <td class="pageInfoValue">● PREMIER CUSTOM HOMES</td>
        <td class="pageInfoLabel">● Salesperson:</td>
        <td class="pageInfoValue">● DAVE MILLER</td>
      </tr>
      <tr>
        <td class="pageInfoLabel">● Job Type:</td>
        <td class="pageInfoValue">● RESIDENTIAL - REMODEL</td>
      </tr>
    </table>
  </div>

  <table class="jobDetailInfoCell">
    <tr>
      <td>Job Address</td>
      <td class="pageInfoValue">
        HENDERSON RESIDENCE<br>
        742 EVERGREEN TERRACE<br>
        SPRINGFIELD, WI 53045<br>
        PHONE: 414-555-0192
      </td>
    </tr>
  </table>

  <table id="ContactsBody">
    <tr>
      <td>MARK STEVENS (PM)</td>
      <td>414-555-8833</td>
    </tr>
  </table>

  <table id="ActivitiesHead">
    <tr>
      <td>ACTIVITY</td>
      <td>PHASE</td>
      <td>ASSIGNED TO</td>
      <td>START DATE</td>
    </tr>
  </table>
  <table id="ActivitiesBody">
    <tr>
      <td>TEMPLATE</td>
      <td>Phase: PH1</td>
      <td>ERIC LARSON</td>
      <td>10/14/2026</td>
    </tr>
    <tr>
      <td>CAD</td>
      <td>Phase: PH1</td>
      <td>MARJO N.</td>
      <td>10/16/2026</td>
    </tr>
  </table>

  <!-- Phase 1 Room 1: Kitchen -->
  <div class="page-subsection-header">
    <span class="formTitle">Job Detail - Kitchen Perimeter</span>
    <span>Phase: PH1</span>
    <table class="detail-form">
      <tr>
        <td><div>Product:</div><div>SILESTONE</div></td>
        <td><div>Color:</div><div>CALACATTA GOLD</div></td>
        <td><div>Thickness:</div><div>3CM</div></td>
        <td><div>Edge Profile:</div><div>EASED</div></td>
      </tr>
      <tr>
        <td><div>Profile-Notes:</div><div>POLISH UNDERSIDE 1"</div></td>
        <td><div>Sink Model:</div><div>BLANCO DIAMOND 440180</div></td>
        <td><div>Sink Type:</div><div>UNDERMOUNT</div></td>
        <td><div>Sink Supplied By:</div><div>HOMEOWNER</div></td>
      </tr>
      <tr>
        <td><div>Holes/Spread:</div><div>1 HOLE CENTER</div></td>
        <td><div>Faucet Model:</div><div>DELTA TRINSIC 9159-BL-DST</div></td>
        <td><div>Faucet Notes:</div><div>INCLUDE SOAP DISPENSER RIGHT @ 4"</div></td>
        <td><div>Backsplash Height:</div><div>4"</div></td>
      </tr>
      <tr>
        <td><div>Splash Info:</div><div>LOOSE SPLASH, FLAT POLISH TOP</div></td>
        <td><div>Side Splash:</div><div>LEFT SIDE ONLY</div></td>
        <td><div>Range/Cooktop Type:</div><div>36" BERTAZZONI GAS RANGE</div></td>
        <td><div>Cabinets:</div><div>NEW CUSTOM - LEVEL & SECURED</div></td>
      </tr>
      <tr>
        <td><div>Tearout:</div><div>EXISTING LAMINATE BY FABRICATOR</div></td>
      </tr>
    </table>
  </div>

  <!-- Phase 1 Room 2: Island -->
  <div class="page-subsection-header">
    <span class="formTitle">Job Detail - Kitchen Island</span>
    <span>Phase: PH1</span>
    <table class="detail-form">
      <tr>
        <td><div>Product:</div><div>SILESTONE</div></td>
        <td><div>Color:</div><div>CALACATTA GOLD</div></td>
        <td><div>Thickness:</div><div>3CM</div></td>
        <td><div>Edge Profile:</div><div>MITERED 2 1/4"</div></td>
      </tr>
      <tr>
        <td><div>Profile-Notes:</div><div>WATERFALL BOTH ENDS</div></td>
        <td><div>Sink Model:</div><div>KOHLER PROLIFIC K-5540</div></td>
        <td><div>Sink Type:</div><div>UNDERMOUNT</div></td>
        <td><div>Sink Supplied By:</div><div>FABRICATOR</div></td>
      </tr>
      <tr>
        <td><div>Holes/Spread:</div><div>2 HOLES (FAUCET + DISPOSER AIR SWITCH)</div></td>
        <td><div>Faucet Model:</div><div>KOHLER PURIST K-596-VS</div></td>
        <td><div>Faucet Notes:</div><div>LOCATE ACCORDING TO TEMPLATE</div></td>
        <td><div>Backsplash Height:</div><div>N/A</div></td>
      </tr>
      <tr>
        <td><div>Range/Cooktop Type:</div><div>N/A</div></td>
        <td><div>Cabinets:</div><div>NEW CUSTOM ISLAND</div></td>
        <td><div>Tearout:</div><div>NO</div></td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

export const SAMPLE_HTML_MULTIPHASE = `
<!DOCTYPE html>
<html>
<head><title>Job Detail - Multi-Phase Commercial</title></head>
<body>
  <div class="jobHeader">
    <table class="pageInfoCenteredJustifiedTable">
      <tr>
        <td class="pageInfoLabel">● Job Name:</td>
        <td class="pageInfoValue">● PINNACLE TOWERS CONDOS</td>
        <td class="pageInfoLabel">● Job #:</td>
        <td class="pageInfoValue">● J26-218</td>
      </tr>
      <tr>
        <td class="pageInfoLabel">● Account:</td>
        <td class="pageInfoValue">● URBAN DEVELOPMENTS LLC</td>
        <td class="pageInfoLabel">● Salesperson:</td>
        <td class="pageInfoValue">● SARAH CHEN</td>
      </tr>
      <tr>
        <td class="pageInfoLabel">● Job Type:</td>
        <td class="pageInfoValue">● MULTI-FAMILY COMMERCIAL</td>
      </tr>
    </table>
  </div>

  <table class="jobDetailInfoCell">
    <tr>
      <td>Job Address</td>
      <td class="pageInfoValue">
        PINNACLE TOWERS UNIT 402<br>
        1200 N PROSPECT AVE<br>
        MILWAUKEE, WI 53202<br>
        PHONE: 414-555-9011
      </td>
    </tr>
  </table>

  <table id="ContactsBody">
    <tr>
      <td>DAVID VANCE (SUPERINTENDENT)</td>
      <td>414-555-4422</td>
    </tr>
  </table>

  <table id="ActivitiesHead">
    <tr>
      <td>ACTIVITY</td>
      <td>PHASE</td>
      <td>ASSIGNED TO</td>
      <td>START DATE</td>
    </tr>
  </table>
  <table id="ActivitiesBody">
    <tr>
      <td>TEMPLATE</td>
      <td>Phase: PH1</td>
      <td>BRETT TYLER</td>
      <td>10/18/2026</td>
    </tr>
    <tr>
      <td>TEMPLATE</td>
      <td>Phase: PH2</td>
      <td>BRETT TYLER</td>
      <td>10/25/2026</td>
    </tr>
    <tr>
      <td>CAD</td>
      <td>Phase: PH1</td>
      <td>MARJO N.</td>
      <td>10/19/2026</td>
    </tr>
  </table>

  <!-- Phase 1: Kitchens -->
  <div class="page-subsection-header">
    <span class="formTitle">Job Detail - Main Kitchen</span>
    <span>Phase: PH1</span>
    <table class="detail-form">
      <tr>
        <td><div>Product:</div><div>CAESARSTONE</div></td>
        <td><div>Color:</div><div>5143 WHITE ATTICA</div></td>
        <td><div>Thickness:</div><div>2CM</div></td>
        <td><div>Edge Profile:</div><div>CRESCENT</div></td>
      </tr>
      <tr>
        <td><div>Sink Model:</div><div>STERLING MCALLISTER 11406</div></td>
        <td><div>Sink Type:</div><div>UNDERMOUNT</div></td>
        <td><div>Sink Supplied By:</div><div>CONTRACTOR</div></td>
        <td><div>Holes/Spread:</div><div>1 HOLE</div></td>
      </tr>
      <tr>
        <td><div>Backsplash Height:</div><div>FULL HEIGHT TO UPPER CABINETS</div></td>
        <td><div>Range/Cooktop Type:</div><div>30" SLIDE-IN INDUCTION</div></td>
        <td><div>Cabinets:</div><div>FLAT PANEL EURO</div></td>
      </tr>
    </table>
  </div>

  <!-- Phase 2: Bathrooms -->
  <div class="page-subsection-header">
    <span class="formTitle">Job Detail - Master Bath Vanity</span>
    <span>Phase: PH2</span>
    <table class="detail-form">
      <tr>
        <td><div>Product:</div><div>CAMBRIA</div></td>
        <td><div>Color:</div><div>ANNICCA</div></td>
        <td><div>Thickness:</div><div>3CM</div></td>
        <td><div>Edge Profile:</div><div>EASED</div></td>
      </tr>
      <tr>
        <td><div>Sink Model:</div><div>KOHLER CAXTON K-2210 (QTY 2)</div></td>
        <td><div>Sink Type:</div><div>UNDERMOUNT</div></td>
        <td><div>Sink Supplied By:</div><div>FABRICATOR</div></td>
        <td><div>Holes/Spread:</div><div>8" WIDESPREAD (3 HOLES PER SINK)</div></td>
      </tr>
      <tr>
        <td><div>Backsplash Height:</div><div>4"</div></td>
        <td><div>Side Splash:</div><div>BOTH SIDES 4"</div></td>
        <td><div>Cabinets:</div><div>FLOATING DOUBLE VANITY</div></td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

export const MOCK_PERFECT_PDF: ParsedPdfData = {
  actualPages: 2,
  statedPages: 2,
  jobNum: 'J26-104',
  jobName: 'HENDERSON RESIDENCE - PH1',
  phone: '414-555-0192',
  contractor: 'PREMIER CUSTOM HOMES',
  sinkModel: 'BLANCO DIAMOND 440180 | KOHLER PROLIFIC K-5540',
  faucetHoles: '1 HOLE CENTER / 2 HOLES',
  backsplash: '4" LOOSE SPLASH',
  rawText: `JOB #: J26-104
JOB NAME: HENDERSON RESIDENCE - PH1
ADDRESS: 742 EVERGREEN TERRACE, SPRINGFIELD, WI 53045
PHONE: 414-555-0192
CONTRACTOR: PREMIER CUSTOM HOMES CONTACT: MARK STEVENS 414-555-8833
DRAWN: 10/14/2026 EL, 10/16/2026 MP
PAGE 1 OF 2
SINK: MAKE/MODEL/COLOR: BLANCO DIAMOND 440180 UNDERMOUNT
FAUCET DRILLINGS: 1 HOLE CENTER DELTA TRINSIC
BACKSPLASH HEIGHT: 4" LOOSE SPLASH, FLAT POLISH TOP
MATERIAL: 3CM SILESTONE CALACATTA GOLD EASED EDGE
`,
  fileName: 'Henderson_Drafted_CAD_Drawing_PH1.pdf',
};

export const MOCK_MISMATCH_PDF: ParsedPdfData = {
  actualPages: 1,
  statedPages: 2, // Sheet mismatch!
  jobNum: 'J26-104',
  jobName: 'HENDERSON RESIDENCE', // Missing PH1 tag!
  phone: '414-555-9999', // Wrong phone number!
  contractor: 'PREMIER CUSTOM HOMES',
  sinkModel: 'ELKAY ELU2816', // Wrong sink model!
  faucetHoles: '3 HOLE 8" SPREAD', // Wrong faucet hole spec!
  backsplash: '6" POLISHED', // Specified 4" in Moraware!
  rawText: `JOB #: J26-104
JOB NAME: HENDERSON RESIDENCE
PHONE: 414-555-9999
CONTRACTOR: PREMIER CUSTOM HOMES
PAGE 1 OF 2
SINK: MAKE/MODEL/COLOR: ELKAY ELU2816
FAUCET DRILLINGS: 3 HOLE 8" SPREAD
BACKSPLASH HEIGHT: 6" POLISHED
`,
  fileName: 'Henderson_CAD_Drawing_Outdated_v1.pdf',
};
