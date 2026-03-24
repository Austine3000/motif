# Research Notes

- `v1.4-MILESTONE-AUDIT.md` reports `SCAF-02` as partial because the Next.js scaffold workflow never actually runs `create-next-app`; only the registry contract is implemented.
- Integration section highlights that the Next.js flow stops at documentation—the scaffold runner never produces a runnable project, so auto-run and flow validation remain blocked.
- Closing this gap requires a runnable App Router project, the overlay instructions from `composer-nextjs.md`, and logging that same project path for downstream phases.

# Questions
- Should the scaffold step reuse the existing scaffold-project runner or spawn a dedicated helper for Next.js-specific wiring?
- How strongly should the verification log (marker file) tie into the Nyquist harness for later waves?
