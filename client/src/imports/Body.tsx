import svgPaths from "./svg-9p66l3gr9f";
import imgUser from "figma:asset/a52dc7b12b847a47f873be0d419feee2dc51b5cf.png";
import imgTemplate from "figma:asset/a79c46ef26f7d232ec171642dfe10e70bdba506e.png";
import imgTemplate1 from "figma:asset/6527748c16b3178be4142d2e312d2aadcf94ae5d.png";
import imgTemplate2 from "figma:asset/6003de5b1a3c86e949d3f6d040a436fc43203ac4.png";
import imgTemplate3 from "figma:asset/0a781cd8d68cdec758e4afda58dea40ae1809763.png";
import imgTemplate4 from "figma:asset/3cec7cf8fbee164da45462737822cee53e3deee6.png";
import imgTemplate5 from "figma:asset/e5fc30774f072b444a254e4fa4db965dc3ed4c4a.png";
import imgTemplate6 from "figma:asset/b4f4944d5432d5c6c1ceb1ffde568860fa50a823.png";
import imgTemplate7 from "figma:asset/f8f765fedd3d0d30caa34e584bd7630eb9f8f106.png";

function Svg() {
  return (
    <div className="h-[16px] relative shrink-0 w-[18px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 16">
        <g id="SVG">
          <path d={svgPaths.p18b65600} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[32px]" data-name="Background">
      <Container />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 1">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-gray-800 tracking-[-0.45px] w-[99.75px]">
        <p className="leading-[28px]">
          Infograph<span className="font-['Inter:Semi_Bold',sans-serif] font-semibold not-italic text-gray-400">.ai</span>
        </p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] items-center relative">
        <Background />
        <Heading />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-center pb-[6px] pt-0 px-0 relative shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0px_0px_2px] border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-900 w-[69.23px]">
        <p className="leading-[20px]">Templates</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-500 w-[77.83px]">
        <p className="leading-[20px]">My Designs</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-500 w-[55.19px]">
        <p className="leading-[20px]">Account</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="box-border content-stretch flex flex-col h-[32px] items-start px-[8px] py-0 relative shrink-0 w-[17px]" data-name="Margin">
      <div className="bg-gray-200 h-[32px] shrink-0 w-px" data-name="Vertical Divider" />
    </div>
  );
}

function User() {
  return (
    <div className="max-w-[32px] pointer-events-none relative rounded-[9999px] shrink-0 size-[32px]" data-name="User">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgUser} />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 rounded-[9999px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[16px] items-center relative">
        <Button />
        <Button1 />
        <Button2 />
        <Margin />
        <User />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-white h-[64px] relative shrink-0 w-full" data-name="Header">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-200 border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex h-[64px] items-center justify-between pb-px pt-0 px-[24px] relative w-full">
          <Container1 />
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold h-[36px] justify-center leading-[0] not-italic relative shrink-0 text-[30px] text-gray-900 w-[247.88px]">
        <p className="leading-[36px]">Template Gallery</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[24px] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-500 w-[552.92px]">
        <p className="leading-[24px]">Choose from our curated collection of professional infographic templates</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Container">
      <Heading1 />
      <Container3 />
    </div>
  );
}

function Svg1() {
  return (
    <div className="h-[14px] relative shrink-0 w-[12.25px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 14">
        <g id="SVG">
          <path d={svgPaths.p222ef300} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Svg1 />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-black box-border content-stretch flex gap-[8px] items-center px-[20px] py-[10px] relative rounded-[8px] shrink-0" data-name="Button">
      <Container5 />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white w-[85.23px]">
        <p className="leading-[20px]">Create Blank</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-0 right-0 top-0" data-name="Container">
      <Container4 />
      <Button3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-[995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-[995px]">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[17px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-400 w-[127.19px]">
          <p className="leading-[normal]">Search templates...</p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex items-start justify-center pb-[15px] pl-[45px] pr-[17px] pt-[14px] relative w-full">
          <Container7 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <div className="absolute bottom-[-0.01%] left-0 right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <g id="SVG">
            <path d={svgPaths.p3f4b2700} fill="var(--fill-0, #9CA3AF)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute bottom-[32.61%] content-stretch flex flex-col items-start left-[16px] top-[32.61%]" data-name="Container">
      <Svg2 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0 w-[1057px]" data-name="Container">
      <Input />
      <Container8 />
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip pl-0 pr-[0.59px] py-px relative rounded-[inherit]">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[17px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-800 w-[92.41px]">
          <p className="leading-[17px]">All Categories</p>
        </div>
      </div>
    </div>
  );
}

function Options() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-start justify-center pl-[21px] pr-[33px] py-[13px] relative rounded-[12px] self-stretch shrink-0" data-name="Options">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Container10 />
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip pl-0 pr-[0.91px] py-px relative rounded-[inherit]">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[17px] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-gray-800 w-[61.09px]">
          <p className="leading-[17px]">All Styles</p>
        </div>
      </div>
    </div>
  );
}

function Options1() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-start justify-center pl-[21px] pr-[33px] py-[13px] relative rounded-[12px] self-stretch shrink-0" data-name="Options">
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Container11 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-start left-0 right-0 top-[100px]" data-name="Container">
      <Container9 />
      <Options />
      <Options1 />
    </div>
  );
}

function Template() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate} />
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-black box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[39.64px]">
        <p className="leading-[16px]">Luxury</p>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template />
        <Background1 />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[149.89px]">
        <p className="leading-[24px]">Modern Real Estate</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[151.59px]">
        <p className="leading-[16px]">Luxury property showcase</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[55.25px]">
        <p className="leading-[16px]">2.4k uses</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container14 />
      <Button4 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading2 />
        <Container13 />
        <Container15 />
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background2 />
        <Container16 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-[1032px] top-0" data-name="Container">
      <BackgroundBorder />
    </div>
  );
}

function Template1() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate1} />
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="absolute bg-gray-800 box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[52px]">
        <p className="leading-[16px]">Standard</p>
      </div>
    </div>
  );
}

function Background4() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template1 />
        <Background3 />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[98.14px]">
        <p className="leading-[24px]">Urban Living</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[180.66px]">
        <p className="leading-[16px]">Contemporary apartment layout</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[52.22px]">
        <p className="leading-[16px]">1.8k uses</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container19 />
      <Button5 />
    </div>
  );
}

function Container21() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading3 />
        <Container18 />
        <Container20 />
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background4 />
        <Container21 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[344px] right-[688px] top-0" data-name="Container">
      <BackgroundBorder1 />
    </div>
  );
}

function Template2() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate2} />
      </div>
    </div>
  );
}

function Background5() {
  return (
    <div className="absolute bg-blue-600 box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[41.09px]">
        <p className="leading-[16px]">Budget</p>
      </div>
    </div>
  );
}

function Background6() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template2 />
        <Background5 />
      </div>
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[89.28px]">
        <p className="leading-[24px]">Cozy Home</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[149.06px]">
        <p className="leading-[16px]">Affordable housing design</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[51.17px]">
        <p className="leading-[16px]">3.1k uses</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container24 />
      <Button6 />
    </div>
  );
}

function Container26() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading4 />
        <Container23 />
        <Container25 />
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background6 />
        <Container26 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[688px] right-[344px] top-0" data-name="Container">
      <BackgroundBorder2 />
    </div>
  );
}

function Template3() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate3} />
      </div>
    </div>
  );
}

function Background7() {
  return (
    <div className="absolute bg-black box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[39.64px]">
        <p className="leading-[16px]">Luxury</p>
      </div>
    </div>
  );
}

function Background8() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template3 />
        <Background7 />
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[126.09px]">
        <p className="leading-[24px]">Penthouse Suite</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[154.69px]">
        <p className="leading-[16px]">Premium property template</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[52.02px]">
        <p className="leading-[16px]">1.5k uses</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container29 />
      <Button7 />
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading5 />
        <Container28 />
        <Container30 />
      </div>
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background8 />
        <Container31 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1032px] right-0 top-0" data-name="Container">
      <BackgroundBorder3 />
    </div>
  );
}

function Template4() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate4} />
      </div>
    </div>
  );
}

function Background9() {
  return (
    <div className="absolute bg-gray-800 box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[52px]">
        <p className="leading-[16px]">Standard</p>
      </div>
    </div>
  );
}

function Background10() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template4 />
        <Background9 />
      </div>
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[135.34px]">
        <p className="leading-[24px]">Family Residence</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[124.97px]">
        <p className="leading-[16px]">Spacious family home</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[54.13px]">
        <p className="leading-[16px]">2.7k uses</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container34 />
      <Button8 />
    </div>
  );
}

function Container36() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading6 />
        <Container33 />
        <Container35 />
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background10 />
        <Container36 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-[1032px] top-[368.5px]" data-name="Container">
      <BackgroundBorder4 />
    </div>
  );
}

function Template5() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate5} />
      </div>
    </div>
  );
}

function Background11() {
  return (
    <div className="absolute bg-black box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[39.64px]">
        <p className="leading-[16px]">Luxury</p>
      </div>
    </div>
  );
}

function Background12() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template5 />
        <Background11 />
      </div>
    </div>
  );
}

function Heading7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[121.05px]">
        <p className="leading-[24px]">Waterfront Villa</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[149.53px]">
        <p className="leading-[16px]">Exclusive coastal property</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[52.42px]">
        <p className="leading-[16px]">1.9k uses</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container39 />
      <Button9 />
    </div>
  );
}

function Container41() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading7 />
        <Container38 />
        <Container40 />
      </div>
    </div>
  );
}

function BackgroundBorder5() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background12 />
        <Container41 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[344px] right-[688px] top-[368.5px]" data-name="Container">
      <BackgroundBorder5 />
    </div>
  );
}

function Template6() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate6} />
      </div>
    </div>
  );
}

function Background13() {
  return (
    <div className="absolute bg-blue-600 box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[41.09px]">
        <p className="leading-[16px]">Budget</p>
      </div>
    </div>
  );
}

function Background14() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template6 />
        <Background13 />
      </div>
    </div>
  );
}

function Heading8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[136.38px]">
        <p className="leading-[24px]">Studio Apartment</p>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[122.52px]">
        <p className="leading-[16px]">Compact living space</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[54.84px]">
        <p className="leading-[16px]">4.2k uses</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container44 />
      <Button10 />
    </div>
  );
}

function Container46() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading8 />
        <Container43 />
        <Container45 />
      </div>
    </div>
  );
}

function BackgroundBorder6() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background14 />
        <Container46 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[688px] right-[344px] top-[368.5px]" data-name="Container">
      <BackgroundBorder6 />
    </div>
  );
}

function Template7() {
  return (
    <div className="aspect-[318/238.5] relative shrink-0 w-full" data-name="Template">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgTemplate7} />
      </div>
    </div>
  );
}

function Background15() {
  return (
    <div className="absolute bg-gray-800 box-border content-stretch flex flex-col items-start px-[8px] py-[4px] right-[12px] rounded-[4px] top-[12px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white w-[52px]">
        <p className="leading-[16px]">Standard</p>
      </div>
    </div>
  );
}

function Background16() {
  return (
    <div className="aspect-[4/3] relative shrink-0 z-[2]" data-name="Background">
      <div className="aspect-[4/3] bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <Template7 />
        <Background15 />
      </div>
    </div>
  );
}

function Heading9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 w-[137.58px]">
        <p className="leading-[24px]">Downtown Condo</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-500 w-[121.44px]">
        <p className="leading-[16px]">City center residence</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-gray-400 w-[51.34px]">
        <p className="leading-[16px]">2.1k uses</p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-blue-600 text-center w-[78.47px]">
        <p className="leading-[16px]">Use Template</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="box-border content-stretch flex items-center justify-between pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container49 />
      <Button11 />
    </div>
  );
}

function Container51() {
  return (
    <div className="relative shrink-0 w-[318px] z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[4px] items-start p-[16px] relative w-[318px]">
        <Heading9 />
        <Container48 />
        <Container50 />
      </div>
    </div>
  );
}

function BackgroundBorder7() {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Background+Border">
      <div className="box-border content-stretch flex flex-col isolate items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Background16 />
        <Container51 />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1032px] right-0 top-[368.5px]" data-name="Container">
      <BackgroundBorder7 />
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute h-[713px] left-0 right-0 top-[170px]" data-name="Container">
      <Container17 />
      <Container22 />
      <Container27 />
      <Container32 />
      <Container37 />
      <Container42 />
      <Container47 />
      <Container52 />
    </div>
  );
}

function Main() {
  return (
    <div className="h-[883px] relative shrink-0 w-[1352px]" data-name="Main">
      <Container6 />
      <Container12 />
      <Container53 />
    </div>
  );
}

export default function Body() {
  return (
    <div className="bg-gray-50 box-border content-stretch flex flex-col gap-[32px] items-center pb-[461px] pt-0 px-0 relative size-full" data-name="Body">
      <Header />
      <Main />
    </div>
  );
}