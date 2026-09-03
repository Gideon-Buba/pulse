-- ============================================================================
-- PULSE — Reconciliation against Aug 18 2026 TWG deck
-- Adds Research & Statistics Department workstream + initiatives, submits
-- the Aug 18 status/latest_update for all 21 original initiatives via
-- initiative_updates (trigger applies onto `initiatives`), and replaces
-- `milestones` with deck-verified per-milestone status. Run after 001+002.
-- Milestone target_date values are approximate (month-level, from deck
-- timeline labels) except where an exact day was shown.
-- ============================================================================

-- --- New workstream: Research & Statistics Department -----------------------
insert into workstreams (name, sort_order) values ('Research & Statistics Department', 7);

insert into initiatives (workstream_id, title, l_gate_stage, status, latest_update, update_as_at)
select id, 'Tax Expenditure Statement', 'L3', 'In progress'::rag_status, 'In the process of mapping the tax incentive legal universe (including exemptions, deductions, credits, etc.), engaging Ministry of Finance to determine the benchmark tax system.', '2026-08-18'
from workstreams where name = 'Research & Statistics Department';

insert into initiatives (workstream_id, title, l_gate_stage, status, latest_update, update_as_at)
select id, 'Tax Gap Analysis', 'L3', 'In progress'::rag_status, 'Analytics team fully set up; currently conducting benchmark assessment for tax gap analysis reports from leading tax agencies.', '2026-08-18'
from workstreams where name = 'Research & Statistics Department';

insert into initiatives (workstream_id, title, l_gate_stage, status, latest_update, update_as_at)
select id, 'Publications Review', 'L3', 'In progress'::rag_status, 'Currently collating the publications inventory covering current and planned outputs, owners, audiences, and frequency.', '2026-08-18'
from workstreams where name = 'Research & Statistics Department';

-- --- Aug 18 status/update submissions for the 21 original initiatives --------
-- (routed through initiative_updates so the trigger applies them and the
--  audit trail is preserved from the first entry)

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'Data sharing underway, with preliminary assessment based solely on crude data due to unavailability of gas data - results submitted to taxpayers who have 30 days to respond. The Data Sharing Agreement is under review and will be finalised prior to advancing API-based integration. Automation still pending on NUPRC''s end and backlog of manual data sharing persists.', 'Resolve DSA at Management; secure NUPRC Q2 crude + Q1&Q2 gas data'
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Fee payments have been onboarded on Rev360 while other processes are underway; operators have commenced payments through Rev360. Focus is on sustaining manual data exchange while advancing system readiness for automated data sharing, as well as defining MSMD system''s scope to ensure no overlap with the Service''s royalty collections mandate.', null
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Key filing functionalities, including estimates and the 12-month breakdown, have been implemented on Rev360. Development of additional filing features, including the 13th month and revisions, is ongoing. Business Analysis and System migration ongoing with GLTG staff actively onboarding through hands-on technical support.', null
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, 'NGN10bn', 'NGN3.5bn', 'ETG: NGN39.7bn assessed (Jan-Jun, 8 depts), NGN32.8bn outstanding (17.5% recovery rate). MTG: NGN22.1bn outstanding as of 25 Jul 2026, 28.2% recovery rate.', null
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Taxpayer regularization efforts have progressed YTD (Jan-Jul 2026): 1,472 inactive taxpayers reactivated, 93.9% performance rate. Total revenue collected stands at NGN1.864bn, backed by targeted enforcement actions including 809 lien placements.', null
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'METD has compiled VAT compliance data from Rev360 and direct field office returns, with a cross-validation exercise underway to ensure accuracy prior to formal gap analysis. Focus is on commencing a formal monitoring exercise targeting field offices identified as falling below minimum expected VAT compliance standards.', null
from initiatives where title = 'VAT compliance gap closure for the METD segment';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'Engagements are still ongoing with the Tax Intelligence & Analytics Department to identify and assess the data sources available on the Tax Intelligence Portal, focused on determining datasets that can support CAP''s risk-based audit case selection and revenue prediction framework. The risk assessment methodology is still being aligned with relevant Directorates to ensure it meets operational audit requirements and user needs.', 'Resolve possible duplication with parallel audit-selection effort; solution must run on Rev360'
from initiatives where title = 'Compliance Assurance Programme (CAP)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'The Virtual Asset Sandbox was launched on 12 August 2026, with 9 VASPs currently confirmed to participate and additional VASPs expected to register.', null
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'SOP review workshops have been completed across offices, with 21 of 21 SOPs reviewed and updated by the consultant. Updated SOPs have been shared with offices for validation, with ongoing engagements to address outstanding concerns. Daily review sessions are underway, with management sign-off targeted for the 1st week of August ahead of transition to digitization and tracking.', null
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'The ICMS is fully integrated into Rev360; however, pre- and post-go-live training has been scheduled for end users and is awaiting approval from the GD.', null
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'Development activities are progressing with the selected vendor, with required inputs already provided by the Tax Intelligence team. Engagements have been held with the Central Bank, while feasibility assessments are ongoing for leveraging NIBSS and IDH capabilities.', 'Secure pending vendor/procurement approvals'
from initiatives where title = 'Revenue Assurance Portal (RAP)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Delayed/at risk'::rag_status, null, null, 'Activities are underway for pilot integration with major gaming platforms, with implementation scheduled to commence in August. Awaiting feedback from the ministerial tenders'' board.', 'Secure pending procurement approvals'
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Rev360 is live for Medium and Emerging Taxpayers and is out of hyper-care phase. Approximately 1.3 million taxpayer records have been migrated from TaxProMax, with ~150,000 unique taxpayers already onboarded to Rev360. Focus is on stabilizing operations during hyper-care and driving continued taxpayer adoption of the platform.', null
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Formal kick-off held on August 12th. Data migration to begin next week.', null
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Final current-state assessment to be presented to executives next week. Documentation for Workspace with Next Counsel ongoing. Phase 1 remains a TBD event until Phase 0 activates it.', null
from initiatives where title = 'One NRS Enterprise Architecture Program';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'Completed'::rag_status, null, null, 'The Tax Intelligence Portal MVP has been successfully deployed and has been operating in production for approximately two months. The platform has transitioned into steady-state operations, with users actively leveraging its capabilities. Focus is on continuous enhancement of functionality and user experience.', null
from initiatives where title = 'NRS Tax Intelligence Portal';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, '100% / 100% / 500k hrs', '84% / 74% / 427,300 hrs', 'As of 17 August 2026: platform has successfully onboarded 12,954 users, maintaining an aggressive engagement level with 4,966 daily active users. More than 20,177 certificates have been issued, reflecting a 74% average course completion rate across the Service. Platform adoption is rising steadily, with 427,300 total learning hours recorded, supported by the ongoing rollout of mandatory training programmes. New courses ready for launch; co-certification discussions with ICAN, CITN and ANAN ongoing.', null
from initiatives where title = 'Learning Platform & Curriculum Modernisation';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Functional testing and UAT to validate the BAS Solution update is scheduled for 20 August 2026, with solution regression testing 22-23 August. Stakeholder and change management engagement and end-user training run 17-28 August. BAS Solution Go-Live and deployment is scheduled for 31 August 2026.', 'Confirm Go-Live readiness ahead of 31 Aug'
from initiatives where title = 'Digital budgetary framework';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'Code review completed, with three substantive defects identified. Automated static security analysis commenced on the delivered source code; Information Security has commenced assessment of the submitted code. Go-live date is set for August, subject to successful completion of security assessment and remediation activities.', null
from initiatives where title = 'Enterprise Risk Management (ERM) automation';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'A comprehensive stakeholder initial workshop session was successfully conducted with key representatives across tax directorates, tax automation, the Project manager and new media, marking a key milestone in the service optimization initiative. To eliminate existing operational gaps, an expanded scope for customer experience is being established. The remaining session of the workshop is scheduled to convene before month-end to refine project milestones and delivery timelines.', null
from initiatives where title = 'Customer service optimization (redesign) program';

insert into initiative_updates (initiative_id, meeting_date, status, target, actual, latest_update, decisions_needed)
select id, '2026-08-18', 'In progress'::rag_status, null, null, 'The procurement process for the Enterprise Performance Management System (EPMS) is underway following the successful engagement of a delivery partner, while framework policy redesign and required approvals are scheduled for completion by month-end. Approval not yet secured as at this TWG - focus is on achieving policy closure and finalizing stakeholder alignment to enable a seamless rollout slated for Q1 2027.', 'Finalise PMF policy approval; confirm stakeholder alignment for Q1 2027 rollout'
from initiatives where title = 'NRS performance management framework (PMF) redesign';

-- --- Milestones: replace wholesale with Aug 18 deck data ---------------------
delete from milestones;  -- clean slate; deck supersedes the CSV at this grain

-- Develop automated data exchange between NUPRC and NRS (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Commence manual data sharing and leverage data provided to validate filings', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define data-sharing and governance framework with NUPRC and sign agreement', 'In progress'::rag_status, '2030-09-01', 2
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design and build API/integration architecture', 'Not started'::rag_status, '2026-12-01', 3
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot automated reconciliation and reporting workflows', 'Not started'::rag_status, '2026-12-01', 4
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Refine based on pilot and implement full rollout and monitoring processes', 'Not started'::rag_status, '2026-12-01', 5
from initiatives where title = 'Develop automated data exchange between NUPRC and NRS';

-- Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS (6 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define data-sharing and governance framework with the Ministry and sign agreement', 'Completed'::rag_status, '2026-02-01', 1
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Commence manual data sharing and leverage data provided to validate filings', 'Completed'::rag_status, '2026-06-01', 2
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Automation of fee payments and integration on Rev360', 'Completed'::rag_status, '2026-06-01', 3
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design and build API/integration architecture', 'Not started'::rag_status, '2026-09-01', 4
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot automated reconciliation and reporting workflows', 'Not started'::rag_status, '2026-10-01', 5
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Refine based on pilot and implement full rollout and monitoring processes', 'Not started'::rag_status, '2026-11-01', 6
from initiatives where title = 'Develop automated data exchange between Ministry of Solid Minerals (MSMD) and NRS';

-- Creation of a module for PPT/CIT/HT upstream filing on Rev360 (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define business and filing requirements for upstream taxpayers', 'Completed'::rag_status, '2026-04-01', 1
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design filing workflows, validation rules, and taxpayer interfaces', 'In progress'::rag_status, '2026-08-01', 2
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop and integrate upstream filing module into Rev360', 'In progress'::rag_status, '2026-09-01', 3
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct user acceptance testing and onboarding', 'Not started'::rag_status, '2026-12-01', 4
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Deploy module and monitor adoption/performance', 'Not started'::rag_status, '2026-12-01', 5
from initiatives where title = 'Creation of a module for PPT/CIT/HT upstream filing on Rev360';

-- Debt management and arrears recovery drive for the METD segment (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Extract and segment outstanding CIT, VAT, and WHT debt portfolio and share with DMED', 'Completed'::rag_status, '2026-11-01', 1
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Issue demand notices and prioritise high-value debtors', 'In progress'::rag_status, '2026-11-01', 2
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Implement structured payment plans and monitoring checkpoints', 'Not started'::rag_status, '2026-11-01', 3
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Escalate unresolved cases for enforcement and legal recovery', 'Not started'::rag_status, '2026-11-01', 4
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Track recovery performance and publish debt recovery dashboard', 'In progress'::rag_status, '2026-11-01', 5
from initiatives where title = 'Debt management and arrears recovery drive for the METD segment';

-- Emerging taxpayer Reactivation and tax Base Expansion initiative (6 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Identify and profile inactive taxpayers using bank transaction intelligence and other third-party data', 'In progress'::rag_status, null, 1
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Allocate verified inactive taxpayer cases to ETG Tax offices for compliance engagement', 'In progress'::rag_status, null, 2
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Facilitate taxpayer reactivation through filing of outstanding returns and taxpayer regularization', 'In progress'::rag_status, null, 3
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Monitor filing and payment compliance of reactivated taxpayers', 'In progress'::rag_status, null, 4
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Establish data-sharing protocols with CAC, commercial banks & fintech platforms, and extend the targeted lien placement strategy to fintech platforms', 'In progress'::rag_status, null, 5
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Evaluate tax base expansion outcomes and optimize programme', 'In progress'::rag_status, null, 6
from initiatives where title = 'Emerging taxpayer Reactivation and tax Base Expansion initiative';

-- VAT compliance gap closure for the METD segment (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct VAT gap analysis using CIT filings and third-party data', 'In progress'::rag_status, '2026-11-01', 1
from initiatives where title = 'VAT compliance gap closure for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop exception reports for turnover and VAT trend analysis', 'In progress'::rag_status, '2026-11-01', 2
from initiatives where title = 'VAT compliance gap closure for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Prioritise high-risk taxpayers for compliance interventions', 'Not started'::rag_status, '2026-11-01', 3
from initiatives where title = 'VAT compliance gap closure for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Execute targeted audits and enforcement activities', 'Not started'::rag_status, '2026-11-01', 4
from initiatives where title = 'VAT compliance gap closure for the METD segment';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Track recovery performance and update compliance risk models', 'Not started'::rag_status, '2026-11-01', 5
from initiatives where title = 'VAT compliance gap closure for the METD segment';

-- Compliance Assurance Programme (CAP) (7 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess current audit and compliance assurance processes', 'Completed'::rag_status, '2026-04-01', 1
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Deploy analytics models linking risk to revenue outcomes (risk selection framework)', 'In progress'::rag_status, '2026-06-01', 2
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Review risk assessment methodology with the GDs across relevant Directorates and Rev360 team', 'Delayed/at risk'::rag_status, '2026-06-01', 3
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Establish performance monitoring and reporting framework', 'Not started'::rag_status, null, 4
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Integrate risk-based selection into Rev360', 'Not started'::rag_status, null, 5
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot CAP across selected taxpayer segments', 'Not started'::rag_status, null, 6
from initiatives where title = 'Compliance Assurance Programme (CAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out service-wide compliance assurance programme', 'Not started'::rag_status, null, 7
from initiatives where title = 'Compliance Assurance Programme (CAP)';

-- Virtual Asset Tax Wallet Pilot Programme (VAWPP) (9 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop pilot architecture and platform', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Onboard participants on NRS'' system', 'In progress'::rag_status, null, 2
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct technical integration and testing', 'In progress'::rag_status, null, 3
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Finalise Taxable Events Framework and integrate on Rev360', 'Completed'::rag_status, '2026-06-01', 4
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'CBN internal sandbox approval finalisation', 'Completed'::rag_status, '2026-06-01', 5
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Launch Sandbox for applications and admit participants', 'Completed'::rag_status, '2026-06-01', 6
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Launch live pilot', 'In progress'::rag_status, '2026-07-01', 7
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Monitor pilot and implement refinements', 'Not started'::rag_status, '2026-07-01', 8
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct integration into NRS core platform', 'Not started'::rag_status, null, 9
from initiatives where title = 'Virtual Asset Tax Wallet Pilot Programme (VAWPP)';

-- Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Review and consolidate existing field SOPs and practice notes', 'Completed'::rag_status, '2026-04-01', 1
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Standardise documentation formats and governance protocols', 'In progress'::rag_status, '2026-05-01', 2
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Digitize and upload approved SOPs into the Virtual Workspace', 'Delayed/at risk'::rag_status, '2026-05-01', 3
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct user onboarding and access management setup', 'Delayed/at risk'::rag_status, '2026-05-01', 4
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Monitor adoption and maintain continuous document updates', 'Delayed/at risk'::rag_status, '2026-05-01', 5
from initiatives where title = 'Digitisation and integration of NRS field SOPs and practice notes into the NRS Virtual Workspace';

-- Field Monitoring and Case Management System (FMCMS / ICMS) (6 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define operational, audit, litigation, and debt management requirements', 'Completed'::rag_status, '2026-04-01', 1
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design workflow automation and case tracking architecture', 'In progress'::rag_status, '2026-04-01', 2
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop and configure FMCMS modules and dashboards', 'Delayed/at risk'::rag_status, '2026-05-01', 3
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct UAT, training and change management', 'Delayed/at risk'::rag_status, '2026-06-01', 4
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot deployment across selected taxpayer segments', 'Not started'::rag_status, '2026-07-01', 5
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out FMCMS across field operations and enforcement teams', 'Not started'::rag_status, '2026-09-01', 6
from initiatives where title = 'Field Monitoring and Case Management System (FMCMS / ICMS)';

-- Revenue Assurance Portal (RAP) (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define transaction reporting and validation requirements', 'Completed'::rag_status, '2026-04-01', 1
from initiatives where title = 'Revenue Assurance Portal (RAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design reconciliation and automated reporting workflows', 'Not started'::rag_status, '2026-10-01', 2
from initiatives where title = 'Revenue Assurance Portal (RAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop integrations with participating financial institutions', 'Not started'::rag_status, '2026-10-01', 3
from initiatives where title = 'Revenue Assurance Portal (RAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot automated transaction validation and reporting', 'Delayed/at risk'::rag_status, '2026-07-01', 4
from initiatives where title = 'Revenue Assurance Portal (RAP)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Deploy portal and monitor reporting quality', 'Delayed/at risk'::rag_status, '2026-08-01', 5
from initiatives where title = 'Revenue Assurance Portal (RAP)';

-- Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess e-commerce transaction ecosystem and compliance gaps', 'Delayed/at risk'::rag_status, '2026-05-01', 1
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define transaction monitoring and compliance rules', 'Delayed/at risk'::rag_status, '2026-06-01', 2
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Build and integrate compliance analytics capabilities', 'Delayed/at risk'::rag_status, '2026-07-01', 3
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot compliance monitoring with selected platforms', 'Delayed/at risk'::rag_status, '2026-08-01', 4
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out continuous compliance monitoring processes', 'Not started'::rag_status, '2026-09-01', 5
from initiatives where title = 'Electronic Revenue Monitoring and Compliance (ERMC) Solution - Gaming and e-commerce';

-- Rev360 - New Tax Administration System (METD) (8 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct current-state assessment of tax administration processes and legacy systems', 'Completed'::rag_status, '2026-01-01', 1
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define business, functional, and technical requirements across core tax functions', 'Completed'::rag_status, '2026-01-01', 2
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design target-state tax administration architecture and integration framework', 'Completed'::rag_status, '2026-02-01', 3
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop interfaces with external stakeholders and government systems', 'Completed'::rag_status, '2026-03-01', 4
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct data cleansing, migration, and validation activities', 'Completed'::rag_status, '2026-03-01', 5
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct taxpayer and staff onboarding, training, and change management', 'Completed'::rag_status, '2026-04-01', 6
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Execute deployment across METD segment', 'Completed'::rag_status, '2026-05-01', 7
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Establish post-go-live support, stabilization, and performance monitoring processes', 'Completed'::rag_status, null, 8
from initiatives where title = 'Rev360 - New Tax Administration System (METD)';

-- Rev360 - New Tax Administration System (GLTD) (11 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Planning & Mobilization - Conduct and document current-state assessment of tax administration processes on Tax Promax', 'Completed'::rag_status, '2026-07-01', 1
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Formal Project Kick Off - Programme mobilisation & team onboarding', 'Completed'::rag_status, '2026-08-01', 2
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Finalise Project Scope & Business Requirements', 'In progress'::rag_status, '2026-08-01', 3
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'System Configuration & Build - Configure and develop taxpayer registration, filing, payment, compliance, audit, and reporting modules', 'In progress'::rag_status, '2026-08-01', 4
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Testing and Quality Assurance - Perform system integration testing (SIT) and user acceptance testing (UAT)', 'Not started'::rag_status, '2026-08-01', 5
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Non-Functional Testing - VAPT, Performance and load testing etc', 'Not started'::rag_status, '2026-08-01', 6
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct taxpayer sensitization and staff training and execute on change and communication management activities', 'Not started'::rag_status, '2026-08-01', 7
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct data migration dress rehearsals (simulations) and validation activities', 'Not started'::rag_status, '2026-09-01', 8
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Execute deployment across GLTD segment - Pilot Go Live', 'Not started'::rag_status, '2026-10-01', 9
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Execute deployment across GLTD segment - Go Live', 'Not started'::rag_status, '2026-10-30', 10
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Hypercare - Establish post-go-live support, stabilization, and performance monitoring processes', 'Not started'::rag_status, '2026-11-01', 11
from initiatives where title = 'Rev360 - New Tax Administration System (GLTD)';

-- One NRS Enterprise Architecture Program (10 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 0 - Conduct enterprise-wide assessment of current applications, integrations, and infrastructure landscape', 'Completed'::rag_status, '2026-08-01', 1
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 0 - Define enterprise architecture principles, standards, and governance framework', 'Completed'::rag_status, '2026-08-01', 2
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 0 - Finalize the current state assessment and issue a completion report to trigger the commencement of phase 1', 'In progress'::rag_status, '2026-08-01', 3
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Develop target-state enterprise architecture blueprint and interoperability model', 'Not started'::rag_status, null, 4
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Identify priority systems, APIs, and integration dependencies across NRS platforms', 'Not started'::rag_status, null, 5
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Design enterprise data, integration, and security architecture standards', 'Not started'::rag_status, null, 6
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Implement enterprise integration and shared services framework', 'Not started'::rag_status, null, 7
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Establish architecture review board and governance processes', 'Not started'::rag_status, null, 8
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Conduct phased alignment of existing systems to enterprise architecture standards', 'Not started'::rag_status, null, 9
from initiatives where title = 'One NRS Enterprise Architecture Program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Phase 1 - Monitor architecture compliance and continuously optimize integration capabilities', 'Not started'::rag_status, null, 10
from initiatives where title = 'One NRS Enterprise Architecture Program';

-- NRS Tax Intelligence Portal (9 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Define enterprise reporting, dashboard, and self-service requirements across business units', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Identify priority KPIs, reporting dimensions, and data sources', 'Completed'::rag_status, '2026-04-01', 2
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design dashboard architecture and self-service user experience', 'Completed'::rag_status, '2026-05-01', 3
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop enterprise reporting dashboards and self-service functionalities', 'Completed'::rag_status, '2026-06-01', 4
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Integrate internal and external data sources into centralized reporting environment', 'Completed'::rag_status, '2026-06-01', 5
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Configure automated reporting, alerts, and performance monitoring workflows', 'Completed'::rag_status, '2026-07-01', 6
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct user testing, training, and stakeholder onboarding', 'Completed'::rag_status, '2026-08-01', 7
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Deploy dashboards and self-service portal across NRS business units', 'Completed'::rag_status, '2026-08-01', 8
from initiatives where title = 'NRS Tax Intelligence Portal';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Establish governance and continuous enhancement processes for reporting and analytics', 'Completed'::rag_status, null, 9
from initiatives where title = 'NRS Tax Intelligence Portal';

-- Learning Platform & Curriculum Modernisation (7 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess current training curriculum and capability gaps', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop modernized curriculum and blended learning framework', 'Completed'::rag_status, '2026-03-01', 2
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Configure, upload content and deploy digital learning platform (including gamification)', 'Completed'::rag_status, '2026-04-01', 3
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Develop faculty governance and content management processes', 'Completed'::rag_status, '2026-05-01', 4
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Hold service-wide sensitization and campaign', 'Completed'::rag_status, '2026-05-01', 5
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Launch enterprise-wide learning programmes', 'Completed'::rag_status, '2026-05-01', 6
from initiatives where title = 'Learning Platform & Curriculum Modernisation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Drive platform usage adoption', 'In progress'::rag_status, null, 7
from initiatives where title = 'Learning Platform & Curriculum Modernisation';

-- Digital budgetary framework (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess current budget lifecycle processes and pain points', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'Digital budgetary framework';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design automated workflow for budget planning and approvals', 'Completed'::rag_status, '2026-03-01', 2
from initiatives where title = 'Digital budgetary framework';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Configure and integrate digital budget management platform', 'Completed'::rag_status, '2026-06-01', 3
from initiatives where title = 'Digital budgetary framework';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct user training and pilot budget submission cycle', 'In progress'::rag_status, '2026-07-01', 4
from initiatives where title = 'Digital budgetary framework';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out enterprise-wide digital budget monitoring', 'In progress'::rag_status, '2026-08-01', 5
from initiatives where title = 'Digital budgetary framework';

-- Enterprise Risk Management (ERM) automation (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess current enterprise risk management processes', 'Completed'::rag_status, '2026-03-01', 1
from initiatives where title = 'Enterprise Risk Management (ERM) automation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Design automated ERM workflows and reporting framework', 'Completed'::rag_status, '2026-03-01', 2
from initiatives where title = 'Enterprise Risk Management (ERM) automation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Configure and deploy ERM system platform', 'Completed'::rag_status, '2026-04-01', 3
from initiatives where title = 'Enterprise Risk Management (ERM) automation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Integrate departmental risk registers and reporting', 'In progress'::rag_status, '2026-08-01', 4
from initiatives where title = 'Enterprise Risk Management (ERM) automation';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out enterprise-wide risk monitoring', 'In progress'::rag_status, '2026-08-01', 5
from initiatives where title = 'Enterprise Risk Management (ERM) automation';

-- Customer service optimization (redesign) program (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess taxpayer service channels and customer pain points', 'In progress'::rag_status, '2026-08-01', 1
from initiatives where title = 'Customer service optimization (redesign) program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Redesign customer service strategy, operating model and workflows', 'In progress'::rag_status, '2026-09-01', 2
from initiatives where title = 'Customer service optimization (redesign) program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Implement upgraded service management processes', 'Not started'::rag_status, '2026-09-01', 3
from initiatives where title = 'Customer service optimization (redesign) program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Train frontline staff and deploy service standards', 'Not started'::rag_status, '2026-09-01', 4
from initiatives where title = 'Customer service optimization (redesign) program';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Pilot redesigned customer journeys', 'Not started'::rag_status, '2026-10-01', 5
from initiatives where title = 'Customer service optimization (redesign) program';

-- NRS performance management framework (PMF) redesign (5 milestones)
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Assess existing performance management framework and gaps', 'In progress'::rag_status, '2026-06-01', 1
from initiatives where title = 'NRS performance management framework (PMF) redesign';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Development and approval of performance management policy (including scorecards, KPI framework, governance and accountability structure)', 'In progress'::rag_status, '2026-08-01', 2
from initiatives where title = 'NRS performance management framework (PMF) redesign';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Complete enablement preparation', 'Not started'::rag_status, '2026-09-01', 3
from initiatives where title = 'NRS performance management framework (PMF) redesign';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Conduct pilot performance review cycles and service-wide goal setting', 'Not started'::rag_status, null, 4
from initiatives where title = 'NRS performance management framework (PMF) redesign';
insert into milestones (initiative_id, title, status, target_date, sequence)
select id, 'Roll out redesigned PMF across the Service', 'Not started'::rag_status, null, 5
from initiatives where title = 'NRS performance management framework (PMF) redesign';

-- Total milestones inserted: 134
-- Sanity checks:
-- select count(*) from initiatives;  -- expect 24
-- select count(*) from milestones;   -- expect 134
-- select * from workstream_summary;