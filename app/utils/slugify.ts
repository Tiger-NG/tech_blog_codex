// 将标题转成 URL 友好的 slug，仅保留 ASCII 字符
export const slugify = (input: string) => {
  if (!input) {
    return ''
  }

  const normalized = input
    .normalize('NFKD')
    // 去除音标之类的组合字符
    .replace(/[\u0300-\u036f]/g, '')

  return normalized
    .toLowerCase()
    .trim()
    // 仅保留 ASCII 字符，其他字符用连字符分隔
    .replace(/[^\x00-\x7f]+/g, '-')
    // 非字母数字字符转换成连字符
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
