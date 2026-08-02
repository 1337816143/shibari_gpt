import { BookOpen, Clock3, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Course } from '../../schemas/course';

interface CatalogItem {
  id: string;
  title: string;
  summary: string;
  category: Course['category'];
  difficulty: string;
  minutes: number;
  tags: string[];
  status: 'available' | 'planned' | 'review';
}

const categories: Array<{ id: 'all' | Course['category']; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'safety', label: '安全入门' },
  { id: 'rope-handling', label: '绳索操作' },
  { id: 'foundations', label: '基础技法' },
  { id: 'body-path', label: '身体绳路' },
];

export function CourseLibrary({ activeCourse, onOpenCourse }: { activeCourse: Course; onOpenCourse: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('all');

  const items: CatalogItem[] = useMemo(() => [
    {
      id: activeCourse.id,
      title: activeCourse.title,
      summary: activeCourse.summary,
      category: activeCourse.category,
      difficulty: '入门',
      minutes: activeCourse.estimatedMinutes,
      tags: activeCourse.tags,
      status: 'available',
    },
    {
      id: 'safety-foundations',
      title: '安全入门：沟通、停止信号与循环检查',
      summary: '课程结构已规划，正式内容需安全审核后发布。',
      category: 'safety',
      difficulty: '入门',
      minutes: 18,
      tags: ['同意', '停止信号', '安全剪'],
      status: 'review',
    },
    {
      id: 'rope-handling-basics',
      title: '基础绳索操作与绳尾管理',
      summary: '面向初学者的理绳、送绳、方向和绳尾控制课程。',
      category: 'rope-handling',
      difficulty: '入门',
      minutes: 20,
      tags: ['理绳', '送绳', '绳尾'],
      status: 'planned',
    },
    {
      id: 'body-path-foundations',
      title: '基础身体绳路与姿势关系',
      summary: '待人物模型、姿势审核和解剖安全体系稳定后制作。',
      category: 'body-path',
      difficulty: '初级',
      minutes: 28,
      tags: ['姿势', '身体标志', '受力'],
      status: 'planned',
    },
  ], [activeCourse]);

  const filtered = items.filter((item) => {
    const categoryMatches = category === 'all' || item.category === category;
    const normalized = query.trim().toLowerCase();
    const queryMatches = !normalized || [item.title, item.summary, ...item.tags].join(' ').toLowerCase().includes(normalized);
    return categoryMatches && queryMatches;
  });

  return (
    <section id="library" className="content-section course-library">
      <div className="section-heading">
        <div><span className="eyebrow">课程库</span><h2>只发布完成审核的课程</h2><p>当前仅开放一门技术验证课程；其他课程明确标记为规划中或审核中。</p></div>
      </div>
      <div className="library-controls">
        <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程、技法或安全主题" /></label>
        <div className="filter-pills" aria-label="课程分类筛选">
          {categories.map((item) => <button key={item.id} className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
      </div>
      <div className="course-card-grid">
        {filtered.map((item) => (
          <article key={item.id} className={`course-card course-card--${item.status}`}>
            <div className="course-card__top"><span>{item.status === 'available' ? <BookOpen size={18} /> : item.status === 'review' ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}{item.status === 'available' ? '可体验' : item.status === 'review' ? '审核中' : '规划中'}</span><small>{item.difficulty}</small></div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="course-card__tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <footer><span><Clock3 size={14} />约 {item.minutes} 分钟</span>{item.status === 'available' ? <button onClick={onOpenCourse}>进入练习室</button> : <button disabled>尚未开放</button>}</footer>
          </article>
        ))}
      </div>
    </section>
  );
}
