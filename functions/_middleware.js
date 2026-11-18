// Lease Redline now lives on the Team Abundance site as "Lease/LOI Guidance".
// Send every visit there.
export const onRequest = () =>
  Response.redirect("https://team-abundance.jilljohnsn13.workers.dev/lease/", 301);
