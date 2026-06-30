export default {
  async scheduled(event, env, ctx) {
    const TTL_DAYS = 30;
    const cutoff = Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000;
    await env.DB.prepare("DELETE FROM auras WHERE created_at < ?").bind(cutoff).run();
  },
};
