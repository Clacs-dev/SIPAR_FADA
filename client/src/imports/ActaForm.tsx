import svgPaths from "./svg-6n5qm0tuwg";

function Icon() {
  return (
    <div className="absolute left-0 size-[15.996px] top-[1.99px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g clipPath="url(#clip0_975_283)" id="Icon">
          <path d={svgPaths.p35b0d2a} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p120f8300} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p67d1b00} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p39ddd00} id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
        <defs>
          <clipPath id="clip0_975_283">
            <rect fill="white" height="15.9961" width="15.9961" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[20px] relative shrink-0 w-[126.738px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon />
        <p className="absolute font-['Arial:Bold',sans-serif] leading-[20px] left-[23.98px] not-italic text-[#0a0a0a] text-[14px] top-[-2px] w-[103px] whitespace-pre-wrap">Participantes (0)</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-[11.25px] size-[15.996px] top-[7.99px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d="M3.33252 7.99805H12.6636" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M7.99805 3.33252V12.6636" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white h-[31.992px] relative rounded-[8px] shrink-0 w-[192.871px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon1 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[111.73px] not-italic text-[#0a0a0a] text-[14px] text-center top-[4px] translate-x-[-50%] whitespace-pre">Adicionar Participante</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[31.992px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Button />
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Nome *</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] whitespace-pre">Nome completo</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[50px] items-start left-0 top-0 w-[904.355px]" data-name="Container">
      <PrimitiveLabel />
      <Input />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Cargo</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] whitespace-pre">Ex: Diretor Geral</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[50px] items-start left-0 top-[61.99px] w-[446.172px]" data-name="Container">
      <PrimitiveLabel1 />
      <Input1 />
    </div>
  );
}

function PrimitiveLabel2() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Departamento</p>
    </div>
  );
}

function PrimitiveSpan() {
  return (
    <div className="h-[20px] relative shrink-0 w-[58.789px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#717182] text-[14px] text-center whitespace-pre">Selecione</p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[15.996px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon" opacity="0.5">
          <path d={svgPaths.p1a395280} id="Vector" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveButton() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13.242px] py-[1.25px] relative size-full">
          <PrimitiveSpan />
          <Icon2 />
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col h-[50px] items-start left-[458.16px] top-[61.99px] w-[446.191px]" data-name="Container">
      <PrimitiveLabel2 />
      <PrimitiveButton />
    </div>
  );
}

function ActaForm1() {
  return (
    <div className="h-[111.992px] relative shrink-0 w-full" data-name="ActaForm">
      <Container1 />
      <Container2 />
      <Container3 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[11.25px] size-[15.996px] top-[7.99px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d={svgPaths.p1c8a6700} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p2a046a00} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-white h-[31.992px] relative rounded-[8px] shrink-0 w-[106.836px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon3 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[68.73px] not-italic text-[#0a0a0a] text-[14px] text-center top-[4px] translate-x-[-50%] whitespace-pre">Cancelar</p>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="absolute left-[10px] size-[15.996px] top-[7.99px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d="M3.33252 7.99805H12.6636" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M7.99805 3.33252V12.6636" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#030213] h-[31.992px] relative rounded-[8px] shrink-0 w-[110.742px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon4 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[70.48px] not-italic text-[14px] text-center text-white top-[4px] translate-x-[-50%] whitespace-pre">Adicionar</p>
      </div>
    </div>
  );
}

function ActaForm2() {
  return (
    <div className="content-stretch flex gap-[7.988px] h-[31.992px] items-start relative shrink-0 w-full" data-name="ActaForm">
      <Button1 />
      <Button2 />
    </div>
  );
}

function CardContent() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[936.348px]" data-name="CardContent">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[11.992px] items-start pb-0 pt-[15.996px] px-[15.996px] relative size-full">
        <ActaForm1 />
        <ActaForm2 />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-[rgba(236,236,240,0.3)] content-stretch flex flex-col h-[198.457px] items-start p-[1.25px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <CardContent />
    </div>
  );
}

function Icon5() {
  return (
    <div className="absolute left-[453.42px] size-[31.992px] top-[17.25px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31.9922 31.9922">
        <g id="Icon" opacity="0.5">
          <path d={svgPaths.p10a14f40} id="Vector" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
          <path d={svgPaths.pdd5c900} id="Vector_2" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
          <path d={svgPaths.p35e256c0} id="Vector_3" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
          <path d={svgPaths.pc790b80} id="Vector_4" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
        </g>
      </svg>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-start left-[1.25px] top-[57.23px] w-[936.348px]" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Arial:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#717182] text-[14px] text-center whitespace-pre-wrap">Nenhum participante adicionado</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[94.473px] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Icon5 />
      <Paragraph />
    </div>
  );
}

export default function ActaForm() {
  return (
    <div className="content-stretch flex flex-col gap-[15.996px] items-start relative size-full" data-name="ActaForm">
      <Container />
      <Card />
      <Container4 />
    </div>
  );
}