// 业务错误。code 给客户端分支，message 给人读，extra 附带学科等上下文。
function coded (code, message, extra) {
  const err = new Error(message)
  err.code = code
  if (extra) err.extra = extra
  return err
}

function toResult (err) {
  return {
    ok: false,
    error: Object.assign(
      {
        code: err.code || 'INTERNAL',
        message: err.message || '服务暂时不可用',
      },
      err.extra || {},
    ),
  }
}

module.exports = { coded, toResult }
