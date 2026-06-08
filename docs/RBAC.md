# Roles and Permissions — PHENIX Studio

Each member of an organization is assigned a role that controls what they can
see and do in PHENIX Studio. This page explains the available roles, what each
one can do, and how to invite and manage members.

---

## Roles

| Role         | Typical user                        | What they can do                                                                                                                               |
| ------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**    | Person who created the organization | Full control — settings, users, credentials, schemas, and data. The only role that can delete the organization.                                |
| **Admin**    | Trusted team lead                   | Everything an Issuer and Verifier can do, plus invite members, update roles, and change organization settings. Cannot delete the organization. |
| **Issuer**   | Staff who issue credentials         | Create schemas and credential definitions, issue credentials (single, bulk, or via email link).                                                |
| **Verifier** | Staff who verify credentials        | Send proof requests and view verification results.                                                                                             |
| **Member**   | Observer / auditor                  | Read-only. Can view schemas, credentials, connections, and verification results, but cannot create or modify anything.                         |

---

## Permission Matrix

| Capability                              | Owner | Admin | Issuer | Verifier | Member |
| --------------------------------------- | :---: | :---: | :----: | :------: | :----: |
| **Organization**                        |       |       |        |          |        |
| View dashboard and org details          |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Update org settings                     |  ✅   |  ✅   |   —    |    —     |   —    |
| Delete org                              |  ✅   |   —   |   —    |    —     |   —    |
| View org members                        |  ✅   |  ✅   |   ✅   |    —     |   ✅   |
| **Members & Invitations**               |       |       |        |          |        |
| Send / delete invitations               |  ✅   |  ✅   |   —    |    —     |   —    |
| View invitations                        |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Change a member's role                  |  ✅   |  ✅   |   —    |    —     |   —    |
| **Schemas**                             |       |       |        |          |        |
| View schemas                            |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Create / update schemas                 |  ✅   |  ✅   |   —    |    —     |   —    |
| **Credential Definitions**              |       |       |        |          |        |
| View credential definitions             |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Create credential definitions           |  ✅   |  ✅   |   —    |    —     |   —    |
| **Issuance**                            |       |       |        |          |        |
| View credentials and issuance records   |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Issue credentials (single, bulk, email) |  ✅   |  ✅   |   ✅   |    —     |   —    |
| **Verification**                        |       |       |        |          |        |
| View proof requests and results         |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |
| Send proof requests                     |  ✅   |  ✅   |   —    |    ✅    |   —    |
| **Connections**                         |       |       |        |          |        |
| View connections                        |  ✅   |  ✅   |   ✅   |    ✅    |   ✅   |

---

## Inviting Members

1. Go to your organization's **Members** page and click **Invite**.
2. Enter the invitee's email address and click **Send**.
3. The system emails the invitee. They join as a **Member** by default (see
   [below](#why-member-is-the-default)).

**If the invitee already has a PHENIX account**, the email links them to Sign
In. After signing in they will see the invitation on their **Invitations** page.

**If the invitee does not yet have an account**, the email links them to a
registration page with their email pre-filled. After completing registration and
signing in, they are taken directly to their **Invitations** page.

In both cases, the invitee clicks **Accept** to join the organization.

---

## Why Member Is the Default

An invitation email could be forwarded or intercepted before the recipient
creates an account. Assigning **Member** (read-only) by default limits what
anyone can do if the wrong person clicks the link. Once the person has joined
and is confirmed, an Owner or Admin can upgrade their role immediately.

---

## Changing a Member's Role

An **Owner** or **Admin** can update any member's role at any time:

1. Go to the organization's **Members** page.
2. Find the user and select their new role.
3. Save — the change takes effect immediately.

A user can hold multiple roles at once. For example, one person can be both
**Issuer** and **Verifier**.
