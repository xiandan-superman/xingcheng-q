// 运行时实际读写的集合名。setup 直接引用这份列表，避免再写一份漂移的名字。
// knowledge_candidates 保留集合，但入库主路径不再写入（草案 §9.5）。
// gen_tasks 只给后台生题服务，学生练习路径不读不写（§9.6 的统计仍在 knowledge_points.publishedCount）。
const COLLECTIONS = [
  'subjects',
  'knowledge_l1',
  'knowledge_points',
  'knowledge_aliases',
  'knowledge_candidates',
  'questions',
  'users',
  'admins',
  'import_jobs',
  'legacy_map_reports',
  'l1_recalc_jobs',
  'attempts',
  'wrong_items',
  'practice_sessions',
  'daily_locks',
  'gen_tasks',
]

module.exports = { COLLECTIONS }
