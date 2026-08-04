import {
  BadgeCheck,
  Box,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileKey2,
  FlaskConical,
  ImageOff,
  MonitorUp,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import type { ModelCatalogOption } from '../../data/modelAssets';
import type { Course, ModelAsset, ReviewRecord } from '../../schemas/course';
import './asset-transparency.css';

interface AssetTransparencyPanelProps {
  course: Course;
  activeAsset: ModelAsset;
  options: ModelCatalogOption[];
  activeAssetId: string;
  onSelectAsset: (assetId: string) => void;
}

const statusLabels: Record<ModelAsset['status'], string> = {
  placeholder: '工程占位',
  'technical-review': '技术审核中',
  approved: '资产已验收',
};

const presentationLabels: Record<ModelAsset['presentation'], string> = {
  'neutral-fully-clothed': '中性、完整着装',
  'neutral-sportswear-midriff': '中性运动装（腹部露出）',
};

const qualityIcons = {
  placeholder: Box,
  mobile: Smartphone,
  full: MonitorUp,
  qa: FlaskConical,
} as const;

function hasCurrentApproval(course: Course, role: ReviewRecord['role'], version: string) {
  return course.reviewRecords.some(
    (record) => record.role === role &&
      record.status === 'approved' &&
      record.reviewedVersion === version &&
      Boolean(record.reviewedAt),
  );
}

function formatBytes(bytes?: number) {
  if (bytes === undefined) return '无需下载';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetTransparencyPanel({
  course,
  activeAsset,
  options,
  activeAssetId,
  onSelectAsset,
}: AssetTransparencyPanelProps) {
  const reviewRecords = course.reviewRecords;
  const releaseGates = [
    { label: '课程人物资产已验收', passed: course.modelAsset.status === 'approved' },
    { label: '课程姿势已验收', passed: course.pose.sourceStatus === 'approved' },
    { label: `绳艺审核匹配课程 v${course.courseVersion}`, passed: hasCurrentApproval(course, 'rope-technique', course.courseVersion) },
    { label: `医学审核匹配课程 v${course.courseVersion}`, passed: hasCurrentApproval(course, 'medical-anatomy', course.courseVersion) },
    { label: `模型审核匹配模型 v${course.modelVersion}`, passed: hasCurrentApproval(course, 'model-technical', course.modelVersion) },
    { label: '课程状态已批准', passed: course.reviewStatus === 'approved' },
  ];
  const passedGateCount = releaseGates.filter((gate) => gate.passed).length;

  return (
    <section className="asset-transparency" aria-labelledby="asset-transparency-title">
      <header>
        <div>
          <span className="eyebrow">模型来源与审核透明度</span>
          <h2 id="asset-transparency-title">所有可用候选都保留，由你直接切换比较</h2>
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
            <div><dt>呈现规范</dt><dd>{presentationLabels[activeAsset.presentation]}</dd></div>
            <div><dt>语义骨骼映射</dt><dd>{Object.keys(activeAsset.boneMap).length} 项</dd></div>
            {activeAsset.kind === 'glb' && (
              <>
                <div><dt>加载预算</dt><dd>{formatBytes(activeAsset.maxBytes)}</dd></div>
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
            <p>模型可被选择和比较，不代表课程内容、绳路或安全文字已经通过审核。</p>
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

        <article className="asset-card asset-card--gates">
          <ShieldAlert size={22} />
          <div>
            <span>正式发布门禁</span>
            <h3>{passedGateCount}/{releaseGates.length} 项通过</h3>
            <p>你可以预览全部技术候选；正式课程发布仍由独立门禁控制。</p>
          </div>
          <ul className="release-gates">
            {releaseGates.map((gate) => (
              <li className={gate.passed ? 'is-passed' : ''} key={gate.label}>
                {gate.passed ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
                <span>{gate.label}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="asset-card asset-card--catalog">
          <div className="asset-catalog__heading">
            <FlaskConical size={22} />
            <div>
              <span>人物模型选择器</span>
              <h3>保留原始质量、移动优化版和技术 QA</h3>
              <p>大文件仍可加载，只是下载更慢。运动装腹部露出会明确标注，但不再从候选中排除。</p>
            </div>
          </div>
          <div className="asset-catalog" role="list" aria-label="可选人物模型">
            {options.map((option) => {
              const selected = option.asset.id === activeAssetId;
              const QualityIcon = qualityIcons[option.qualityTier];
              return (
                <article className={`asset-option${selected ? ' is-selected' : ''}`} key={option.asset.id} role="listitem">
                  <div className="asset-option__preview">
                    {option.previewUrl ? (
                      <img src={option.previewUrl} alt={`${option.asset.displayName} 正面预览`} loading="lazy" />
                    ) : (
                      <div className="asset-option__placeholder"><ImageOff size={30} /><span>{option.qualityTier === 'placeholder' ? '程序化模型' : '无静态预览'}</span></div>
                    )}
                    <span className="asset-option__badge"><QualityIcon size={13} />{option.badge}</span>
                    {option.recommended && <span className="asset-option__recommended">推荐</span>}
                  </div>
                  <div className="asset-option__body">
                    <h4>{option.asset.displayName}</h4>
                    <p>{option.description}</p>
                    <dl>
                      <div><dt>体积</dt><dd>{formatBytes(option.sizeBytes)}</dd></div>
                      <div><dt>着装</dt><dd>{presentationLabels[option.asset.presentation]}</dd></div>
                      <div><dt>状态</dt><dd>{statusLabels[option.asset.status]}</dd></div>
                    </dl>
                    {option.warning && <div className="asset-option__warning"><ShieldAlert size={15} />{option.warning}</div>}
                    <button
                      type="button"
                      className={selected ? 'is-selected' : ''}
                      onClick={() => onSelectAsset(option.asset.id)}
                      aria-pressed={selected}
                      aria-label={`${selected ? '已选择' : '选择'} ${option.asset.displayName}`}
                    >
                      {selected ? <><BadgeCheck size={17} />当前使用</> : <><Box size={17} />选择此模型</>}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
