export const mapQuickTaskInput = (title) => ({
  title,
  status: "offen",
  priority: "normal",
  created_at: new Date().toISOString()
});
