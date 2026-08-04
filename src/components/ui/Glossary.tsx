import { BookOpenText } from 'lucide-react';
import './glossary.css';

const terms = [
  ['活动绳头', '可以直接拉动、用于继续操作或解除的绳端。课程必须让它始终可识别、可触达。'],
  ['留隙检查', '用手指或视觉确认绳索与身体之间仍有适当空间；它不能替代感觉、颜色、温度和主动运动检查。'],
  ['非承重', '绳索不承担人体重量，也不用于悬挂、提拉或限制跌落。'],
  ['神经症状', '麻木、刺痛、灼痛、电击感、肌力下降或运动异常；出现时应立即解除并停止。'],
  ['循环检查', '观察颜色、温度、肿胀和毛细血管回填等变化，并结合主观感觉与主动运动。'],
  ['GLB', 'glTF 的单文件二进制容器，可封装网格、骨骼、动画、材质和纹理。'],
  ['骨骼 / Rig', '驱动人物姿势的关节层级。骨骼存在不代表旋转中心、权重和动作已经适合教学。'],
  ['蒙皮权重', '决定每个顶点受哪些骨骼影响以及影响比例；错误权重会造成关节塌陷、拉丝或穿模。'],
  ['Landmark', '经过审核的人体定位点或骨骼局部参考点，用于绑定绳路、风险区和相机焦点。'],
  ['LOD', 'Level of Detail。根据设备和观看距离切换不同复杂度的网格与纹理，以控制移动端性能。'],
  ['技术审核', '只验证文件、许可、加载、几何、骨骼、材质和性能，不代表课程动作与医学安全已批准。'],
  ['课程审核', '对姿势、绳路、张力方向、检查点、解除顺序和安全表述进行独立专业复核。'],
] as const;

export function Glossary() {
  return (
    <section id="glossary" className="glossary content-section" aria-labelledby="glossary-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">术语表</span>
          <h2 id="glossary-title">学习界面中的安全与 3D 术语</h2>
        </div>
        <BookOpenText size={28} />
      </div>
      <div className="glossary__grid">
        {terms.map(([term, definition]) => (
          <details key={term}>
            <summary>{term}</summary>
            <p>{definition}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
