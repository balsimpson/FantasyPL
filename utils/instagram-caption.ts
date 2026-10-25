export function splitInstagramCaption(caption: string) {
  return caption.split(/(#[\p{L}\p{M}\p{N}_]+)/u).filter(Boolean).map(text => ({
    text,
    hashtag: /^#[\p{L}\p{M}\p{N}_]+$/u.test(text),
  }))
}
