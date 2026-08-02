import { BadgeCheck, Box, ExternalLink, FileKey2, FlaskConical, ShieldAlert } from 'lucide-react';
import type { Course, ModelAsset } from '../../schemas/course';
import './asset-transparency.css';

interface AssetTransparencyPanelProps {
  course: Course;
  activeAsset: ModelAsset;
  usingQaAsset: boolean;
  onToggleQaAsset: () => void;
}

const statusLabels: Record<ModelAsset['status'], string> = {
  placeholder: '工程占位',
  'technical-review': '技术审核中',
  approved: '资产已验收',
};

export function AssetTransparencyPanel({ course, activeAsset, usingQaAsset, onToggleQaAsset }: AssetTransparencyPanelProps) {
  const reviewRecords = course.reviewRecords;

  return (
    <section className="asset-transparency" aria-labelledby="asset-transparency-title">
      <header>
        <div>
          <span className="eyebrow">模型来源与审核透明度</span>
          <h2 id="asset-transparency-title">看得见资产状态，也看得见尚未完成的审核</h2>
        </div>
        <span className={`asset-status asset-status--${activeAsset.status}`}>{statusLabels[activeAsset.status]}</span>
      </header>

      <div className="asset-transparency__grid">
        <article className="asset-card asset-card--primary">
          <Box size={22} />
          <div>
            <span>当前人物资产</span>
            <h3>{activeAsset.displayName}</h3>
            <p>{activeAsset.attribution}</p>
          </div>
          <dl>
            <div><dt>格式</dt><dd>{activeAsset.kind === 'glb' ? 'GLB 2.0' : '程序化 Three.js'}</dd></div>
            <div><dt>许可证</dt><dd>{activeAsset.license}</dd></div>
            <div><dt>成年人声明</dt><dd>{activeAsset.adultPresentation ? '是' : '否'}</dd></div>
            <div><dt>呈现规范</dt><dd>中性、完整着装</dd></div>
            {activeAsset.kind === 'glb' && (
              <>
                <div><dt>加载预算</dt><dd>{Math.round(activeAsset.maxBytes / 1024 / 1024)} MB</dd></div>
                <div><dt>超时</dt><dd>{Math.round(activeAsset.timeoutMs / 1000)} 秒</dd></div>
                <div><dt>完整性</dt><dd>{activeAsset.sha256 ? 'SHA-256 强校验' : '尚未登记哈希'}</dd></div>
              </>
            )}
          </dl>
          {activeAsset.kind === 'glb' && (
            <div className="asset-links">
              <a href={activeAsset.sourceUrl} target="_blank" rel="noreferrer">查看来源<ExternalLink size={14} /></a>
              <a href={activeAsset.licenseUrl} target="_blank" rel="noreferrer">查看许可证<ExternalLink size={14} /></a>
            </div>
          )}
        </article>

        <article className="asset-card">
          <FileKey2 size={22} />
          <div>
            <span>课程审核记录</span>
            <h3>{reviewRecords.length ? `${reviewRecords.length} 条记录` : '尚无独立审核记录'}</h3>
            <p>资产通过技术验收，不代表课程内容、绳路或安全文字已经通过审核。</p>
          </div>
          {reviewRecords.length ? (
            <ul className="review-records">
              {reviewRecords.map((record) => (
                <li key={record.id}>
                  <strong>{record.role}</strong>
                  <span>{record.status} · {record.reviewer}</span>
                  <small>{record.notes}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-review"><ShieldAlert size={18} />专业绳师与医学/人体结构审核仍未完成。</div>
          )}
        </article>

        <article className="asset-card asset-card--lab">
          <FlaskConical size={22} />
          <div>
            <span>加载器技术实验室</span>
            <h3>本地骨骼 GLB 端到端验证</h3>
            <p>QA 资产只用于验证下载、哈希、骨骼、材质、回退和诊断，不作为课程示范人物。</p>
          </div>
          <button type="button" onClick={onToggleQaAsset}>
            {usingQaAsset ? <><BadgeCheck size={17} />返回课程占位模型</> : <><FlaskConical size={17} />加载技术 QA 模型</>}
          </button>
        </article>
      </div>
    </section>
  );
}
