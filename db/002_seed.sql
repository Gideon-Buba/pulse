-- ============================================================================
-- PULSE — Seed data
-- Extracted from NRS_Transformation_Initiative_Register.xlsx as at
-- 4 Aug 2026 TWG (minutes-forward). 6 workstreams, 21 initiatives.
-- Directorate/Owner is blank for every row in the source workbook — same
-- gap flagged on the SharePoint register. Fill in once you have that data.
-- ============================================================================

insert into workstreams (name, sort_order) values
  ('Tax Operations', 1),
  ('Technical & Compliance', 2),
  ('Technology', 3),
  ('People, Stakeholder & Communication', 4),
  ('Finance & Corporate Services', 5),
  ('Strategic Initiatives', 6);

-- --- Tax Operations ---------------------------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Develop automated data exchange between NUPRC and NRS', 'L2', 'Oil & gas royalty collections', 'TBD', 'TBD', 'Delayed/at risk',
  'Manual data sharing underway; preliminary assessment on crude data only (gas data unavailable) - results sent to taxpayers with a 30-day window. DSA under review, to be finalised before API integration. DSA escalated to Management.',
  'Resolve DSA at Management; secure NUPRC Q2 crude + Q1&Q2 gas data', '2026-07-28'
from workstreams where name = 'Tax Operations';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS', 'L2', 'Mineral royalty collections', 'TBD', 'TBD', 'Delayed/at risk',
  'Manual data sharing in place; joint stakeholder engagement held. Alignment to digitise MSMD processes and automate royalty payments on Rev360. Full integration pending MSMD system build. Discussions with Technology Team ongoing - no definitive status yet.',
  'Resolve blockers to MSMD data-sharing automation', '2026-07-28'
from workstreams where name = 'Tax Operations';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Creation of a module for PPT/CIT/HT upstream filing on Rev360', 'L3', 'Filing adoption rate', '100%', '0%', 'In progress',
  'Estimates and 12-month breakdown filing functionalities implemented on Rev360. 13th-month and revisions development ongoing. Business analysis and system migration ongoing with GLTG staff onboarding via hands-on support.',
  null, '2026-07-28'
from workstreams where name = 'Tax Operations';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Debt management and arrears recovery drive for the METD segment', 'L3', 'Debt recovery', 'NGN10bn', 'NGN3.5bn', 'In progress',
  'ETG: NGN39.7bn assessed (Jan-Jun, 8 depts), NGN32.8bn outstanding (17.5% recovery), ETD-FCT largest. MTG: NGN22.1bn outstanding as of 25 Jul (28.2% recovery). ETG outstanding reduced 39.7 -> 32.8bn; MTG update expected month-end.',
  null, '2026-08-03'
from workstreams where name = 'Tax Operations';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Emerging taxpayer Reactivation and tax Base Expansion initiative', 'L4', 'VAT & CIT collections', 'TBD', 'TBD', 'In progress',
  'YTD 1,472 inactive taxpayers reactivated (93.9% performance); NGN1.864bn collected; 809 lien placements. No substantive change this cycle - July reports still being collected and validated against Rev360; fuller update next TWG.',
  null, '2026-08-03'
from workstreams where name = 'Tax Operations';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'VAT compliance gap closure for the METD segment', 'L3', 'VAT collection uplift', 'TBD', 'TBD', 'Delayed/at risk',
  'Compiled VAT data from Rev360 and field returns; cross-validation underway before formal gap analysis. Persistent mismatches between TaxPro/Rev360 and manual records; audit collections not recognised in system - discrepancies escalated to Tax Automation Team.',
  null, '2026-08-03'
from workstreams where name = 'Tax Operations';

-- --- Technical & Compliance --------------------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Compliance Assurance Programme (CAP)', 'L2', 'Additional assessment', 'TBD', 'TBD', 'In progress',
  'Risk-based audit framework completed. Engagements with Analytics and Rev360 teams underway on data/analytical capabilities for the Risk Compliance Framework. Methodology still being aligned with Directorates. Discovered a parallel audit-selection initiative - assessing duplication.',
  'Resolve possible duplication with parallel audit-selection effort; solution must run on Rev360', '2026-08-03'
from workstreams where name = 'Technical & Compliance';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)', 'L2', 'VAT & stamp duty collections', 'TBD', 'TBD', 'In progress',
  'Sandbox launch at advanced stage - expected next week. VATC guidelines due next week. Implementation approach agreed with vendor; 3 PSPs onboarding for settlement into CBN accounts. Guidelines published on NRS website. Executive Order triggered inaugural CBN/NRS/ONSA/NFIU meeting. All in-control activities done; remaining dependency is CBN.',
  'Escalate CBN to accelerate sandbox launch; awaiting CBN RFA', '2026-08-03'
from workstreams where name = 'Technical & Compliance';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace', 'L3', 'SOP digitisation / user adoption', 'TBD', 'TBD', 'In progress',
  '21 of 21 SOPs reviewed and updated by consultant. Updated SOPs shared with offices for validation; daily review sessions underway. Management sign-off targeted 1st week August, then transition to Rev360 team for digitisation and tracking.',
  null, '2026-08-03'
from workstreams where name = 'Technical & Compliance';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Field Monitoring and Case Management System (FMCMS / ICMS)', 'L3', 'System utilisation rate', '100%', '97%', 'In progress',
  'ICMS fully live and fully integrated with Rev360; solution deployed to production; 97% complete. User admin decentralised to Heads of Bureau. ~3,000 existing cases migrating to new Tax ID. Onboarding commenced. Abuja go-live next; Lagos, PH, Ibadan scheduled. First case management system in NRS history - commended by TO.',
  null, '2026-08-04'
from workstreams where name = 'Technical & Compliance';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Revenue Assurance Portal (RAP)', 'L3', 'Institution integration rate', '100%', 'TBD', 'Delayed/at risk',
  'No major implementation change. Development progressing with vendor; inputs provided by Tax Intelligence team. Engagements with CBN; feasibility assessments ongoing for NIBSS and IDH. Virtual stakeholder engagement held; awaiting formal feedback on resolutions.',
  'Secure pending vendor/procurement approvals', '2026-07-28'
from workstreams where name = 'Technical & Compliance';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce', 'L1', 'Incremental VAT collections', 'TBD', 'TBD', 'In progress',
  'Vendor approval secured - implementation activities can progress. Pilot integration with major gaming platforms underway; implementation scheduled to commence August. Some technical blockers addressed; fuller update once project lead joins.',
  'Secure pending procurement approvals', '2026-07-28'
from workstreams where name = 'Technical & Compliance';

-- --- Technology --------------------------------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Rev360 - New Tax Administration System (METD)', 'L4', 'Process digitisation / user adoption', 'TBD', 'TBD', 'In progress',
  'Rev360 live for Medium and Emerging Taxpayers; out of hyper-care. ~1.3m records migrated from TaxProMax; ~150,000 unique taxpayers onboarded. Focus on stabilisation and adoption.',
  null, '2026-07-30'
from workstreams where name = 'Technology';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Rev360 - New Tax Administration System (GLTD)', 'L2', 'Process digitisation / user adoption', '100%', 'TBD', 'In progress',
  'Walkthrough conducted 21st; formal kick-off 12 Aug. Baseline BRD development ongoing. Go-Live locked for 30 Oct, taxpayer use from 1 Nov. Granular issues under review.',
  null, '2026-07-30'
from workstreams where name = 'Technology';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'One NRS Enterprise Architecture Program', 'L1', 'Architecture compliance rate', '100%', 'TBD', 'In progress',
  'Phase 0 underway. IRR data collection 70% complete, 30% pending stakeholder sign-offs. Consultants engaging EDs and key stakeholders on enterprise-wide business architecture; baseline draft expected 31 Jul. Phase 1 TBD until Phase 0 completes.',
  null, '2026-07-30'
from workstreams where name = 'Technology';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'NRS Tax Intelligence Portal', 'L4', 'User accessibility rate', '100%', '100%', 'Completed',
  'MVP deployed and in production ~2 months; steady-state operations with active users. Focus on continuous enhancement of functionality and UX.',
  null, '2026-07-30'
from workstreams where name = 'Technology';

-- --- People, Stakeholder & Communication --------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Learning Platform & Curriculum Modernisation', 'L4', 'Platform adoption / Training completion / Learning hours', '100% / 100% / 500k hrs', '84% / 57% / 315k hrs', 'In progress',
  'As of 31 Jul: 12,669 onboarded; 5,745 daily active users; 14,498 certificates issued; 69% avg completion; 315,000 total learning hours. New courses ready; co-certification talks with ICAN, CITN, ANAN ongoing.',
  'PSC to correct stale 169k learning-hours figure on deck KPI box to 315k', '2026-07-31'
from workstreams where name = 'People, Stakeholder & Communication';

-- --- Finance & Corporate Services ----------------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Digital budgetary framework', 'L3', 'Budget process digitisation / user adoption', '100%', 'TBD', 'Delayed/at risk',
  'Spend Request module UAT conducted; observations pending fixes by Technology team and revalidation. Go-Live window (6-13 Jul) on hold pending resolution. Revised date TBD; then SAP integration, infra validation, access config, data migration.',
  'Confirm revised Go-Live date after fixes', '2026-07-31'
from workstreams where name = 'Finance & Corporate Services';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Enterprise Risk Management (ERM) automation', 'L3', 'ERM adoption / risk monitoring coverage', '100%', 'TBD', 'In progress',
  'Dashboard fully deployed to NRS servers; production provisioned; Risk Radar deployed without critical errors; data migration and smoke testing validated. Cybersecurity + Codeware security review: 4 of 5 checks passed; 1 open (GitLab). Sensitisation covered 17 departments.',
  'Resolve outstanding GitLab security check', '2026-07-31'
from workstreams where name = 'Finance & Corporate Services';

-- --- Strategic Initiatives --------------------------------------------------
insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'Customer service optimization (redesign) program', 'L2', 'Taxpayer satisfaction / service resolution', '100%', 'TBD', 'In progress',
  'All four surveys deployed across channels - key data-collection milestone. Responses still being received; detailed analysis once target sample size achieved.',
  null, '2026-08-03'
from workstreams where name = 'Strategic Initiatives';

insert into initiatives (workstream_id, title, l_gate_stage, kpi_expected_impact, target, actual, status, latest_update, decisions_needed, update_as_at)
select id, 'NRS performance management framework (PMF) redesign', 'L3', 'PMF adoption / performance review completion', '100%', 'TBD', 'In progress',
  'PMF design approved by Management (confirmed in Aug 4 minutes). Options refined via stakeholder engagement and syndicated with GD HCM and SMO; approval now secured. Focus shifts to enablement preparation and rollout.',
  'None outstanding - approval secured; proceed to enablement', '2026-08-04'
from workstreams where name = 'Strategic Initiatives';

-- Sanity check: should return 21
-- select count(*) from initiatives;
