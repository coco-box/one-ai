import type { Parent, Root, Text } from 'mdast';
import { describe, expect, it } from 'vitest';
import { createMarkdownDiffAst } from '../src/lib/diff';

function getInlineDiffText(node: Parent, type: 'inlineDel' | 'inlineIns') {
  return (node.children ?? [])
    .filter(child => child.type === type)
    .flatMap(child => ((child as Parent).children ?? []) as Text[])
    .map(child => child.value)
    .join('');
}

describe('createMarkdownDiffAst', () => {
  it('会把单文本段落中的末尾句号删除识别为行内差异', () => {
    const oldMarkdown = '大促当晚 21:08 收到 P0 告警，支付接口失败率达 35%、P99 超 10s。通过链路追踪快速定位到 pay-service → MySQL 耗时异常。排查发现对账批跑 Job 在大促流量冲击下与实时支付事务产生行锁死锁，导致数据库连接池（上限 500）全部耗尽，TCP 积压引发全链雪崩。21:25 启动熔断降级 + 杀长事务完成止血；21:38 扩容连接池至 1000 并优化对账 SQL 索引；22:05 全链路恢复，验证通过后关闭降级开关。';
    const newMarkdown = '大促当晚 21:08 收到 P0 告警，支付接口失败率达 35%、P99 超 10s。通过链路追踪快速定位到 pay-service → MySQL 耗时异常。排查发现对账批跑 Job 在大促流量冲击下与实时支付事务产生行锁死锁，导致数据库连接池（上限 500）全部耗尽，TCP 积压引发全链雪崩。21:25 启动熔断降级 + 杀长事务完成止血；21:38 扩容连接池至 1000 并优化对账 SQL 索引；22:05 全链路恢复，验证通过后关闭降级开关';

    const diffAst = createMarkdownDiffAst(oldMarkdown, newMarkdown) as Root;

    expect(diffAst.children).toHaveLength(1);
    expect(diffAst.children?.[0]?.type).toBe('paragraph');

    const paragraph = diffAst.children?.[0] as Parent;
    expect(getInlineDiffText(paragraph, 'inlineDel')).toBe('。');
    expect(getInlineDiffText(paragraph, 'inlineIns')).toBe('');

    const rootChildTypes = diffAst.children?.map(child => child.type) ?? [];
    expect(rootChildTypes).not.toContain('del');
    expect(rootChildTypes).not.toContain('ins');
  });

  it('不会破坏带前置列表项时原本正确的段落行内 diff', () => {
    const oldMarkdown = '- 1\n\n大促当晚 21:08 收到 P0 告警，支付接口失败率达 35%、P99 超 10s。通过链路追踪快速定位到 pay-service → MySQL 耗时异常。排查发现对账批跑 Job 在大促流量冲击下与实时支付事务产生行锁死锁，导致数据库连接池（上限 500）全部耗尽，TCP 积压引发全链雪崩。21:25 启动熔断降级 + 杀长事务完成止血；21:38 扩容连接池至 1000 并优化对账 SQL 索引；22:05 全链路恢复，验证通过后关闭降级开关。';
    const newMarkdown = '- 1\n\n大促当晚 21:08 收到 P0 告警，支付接口失败率达 35%、P99 超 10s。通过链路追踪快速定位到 pay-service → MySQL 耗时异常。排查发现对账批跑 Job 在大促流量冲击下与实时支付事务产生行锁死锁，导致数据库连接池（上限 500）全部耗尽，TCP 积压引发全链雪崩。21:25 启动熔断降级 + 杀长事务完成止血；21:38 扩容连接池至 1000 并优化对账 SQL 索引；22:05 全链路恢复，验证通过后关闭降级开关';

    const diffAst = createMarkdownDiffAst(oldMarkdown, newMarkdown) as Root;

    expect(diffAst.children?.map(child => child.type)).toEqual(['list', 'paragraph']);

    const paragraph = diffAst.children?.[1] as Parent;
    expect(getInlineDiffText(paragraph, 'inlineDel')).toBe('。');
    expect(getInlineDiffText(paragraph, 'inlineIns')).toBe('');
  });
});
