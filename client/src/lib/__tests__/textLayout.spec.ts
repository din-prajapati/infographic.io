import {describe,expect,it} from 'vitest';
import {formatTextContent,textLetterSpacingPx,textAnchorOffset} from '../textLayout';
describe('US-EDIT-034 text layout',()=>{
  it('title cases every word without rewriting the source',()=>{
    const content='hello WORLD\nbeautiful home';
    expect(formatTextContent({content,textTransform:'capitalize',listStyle:'none'})).toBe('Hello World\nBeautiful Home');
    expect(content).toBe('hello WORLD\nbeautiful home');
    expect(formatTextContent({content:"DON\u2019T stop",textTransform:'capitalize',listStyle:'none'})).toBe("Don\u2019t Stop");
    expect(formatTextContent({content:"DON'T miss caf\u00e9-ville",textTransform:'capitalize',listStyle:'none'})).toBe("Don't Miss Caf\u00e9-Ville");
  });
  it('preserves existing single list prefix',()=>{
    expect(formatTextContent({content:'one\ntwo',textTransform:'none',listStyle:'bullet'})).toBe('\u2022 one\ntwo');
  });
  it('converts tracking units to design pixels with absent tracking neutral',()=>{
    expect(textLetterSpacingPx(20,100)).toBe(2);
    expect(textLetterSpacingPx(20,-200)).toBe(-4);
    expect(textLetterSpacingPx(20)).toBe(0);
  });
  it('anchors a two-line 40px block within 100px with 4px padding',()=>{
    expect(textAnchorOffset(100,40,'start')).toBe(4);
    expect(textAnchorOffset(100,40,'middle')).toBe(30);
    expect(textAnchorOffset(100,40,'end')).toBe(56);
    expect(textAnchorOffset(100,40)).toBe(4);
    expect(textAnchorOffset(20,40,'end')).toBe(4);
  });
});
