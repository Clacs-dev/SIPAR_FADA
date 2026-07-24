import svgPaths from "./svg-a833cezjeo";

function Icon() {
  return (
    <div className="absolute left-0 size-[20px] top-0" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p25397b80} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p18e6a68} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2241fff0} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2c4f400} id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function CardTitle() {
  return (
    <div className="absolute h-[20px] left-[23.98px] top-[23.98px] w-[456.172px]" data-name="CardTitle">
      <Icon />
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-[27.99px] not-italic text-[#0a0a0a] text-[16px] top-[-0.76px] whitespace-pre">Agendar Reunião Interna</p>
    </div>
  );
}

function CardDescription() {
  return (
    <div className="absolute h-[23.984px] left-[23.98px] top-[49.98px] w-[456.172px]" data-name="CardDescription">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[24px] left-0 not-italic text-[#717182] text-[16px] top-[-1.75px] whitespace-pre">Agende reuniões com outros membros da equipa</p>
    </div>
  );
}

function CardHeader() {
  return (
    <div className="h-[73.965px] relative shrink-0 w-[504.141px]" data-name="CardHeader">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <CardTitle />
        <CardDescription />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-[13.24px] size-[15.996px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d={svgPaths.p1c8a6700} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p2a046a00} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white h-[35.996px] relative rounded-[8px] shrink-0 w-[112.813px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon1 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[72.71px] not-italic text-[#0a0a0a] text-[14px] text-center top-[6.01px] translate-x-[-50%] whitespace-pre">Cancelar</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[59.98px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <CardHeader />
      <Button />
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Título da Reunião *</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] whitespace-pre">Ex: Reunião de Alinhamento</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[58px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.988px] items-start relative size-full">
        <PrimitiveLabel />
        <Input />
      </div>
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Tipo de Reunião *</p>
    </div>
  );
}

function PrimitiveSpan() {
  return (
    <div className="h-[20px] relative shrink-0 w-[57.5px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-pre">Ordinária</p>
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
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[66px] items-start left-[0.02px] top-0 w-[386px]" data-name="Container">
      <PrimitiveLabel1 />
      <PrimitiveButton />
    </div>
  );
}

function PrimitiveLabel2() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Órgão *</p>
    </div>
  );
}

function PrimitiveSpan1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[111.289px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#717182] text-[14px] text-center whitespace-pre">Selecione o órgão</p>
      </div>
    </div>
  );
}

function Icon3() {
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

function PrimitiveButton1() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13.242px] py-[1.25px] relative size-full">
          <PrimitiveSpan1 />
          <Icon3 />
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[66px] items-start left-[455.02px] top-0 w-[383px]" data-name="Container">
      <PrimitiveLabel2 />
      <PrimitiveButton1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[66px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container3 />
        <Container4 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[15.996px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g clipPath="url(#clip0_984_2938)" id="Icon">
          <path d={svgPaths.p35b0d2a} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p299e6680} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p67d1b00} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p39ddd00} id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
        <defs>
          <clipPath id="clip0_984_2938">
            <rect fill="white" height="15.9961" width="15.9961" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function PrimitiveLabel3() {
  return (
    <div className="flex-[1_0_0] h-[23.984px] min-h-px min-w-px relative" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <p className="font-['Arial:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#0a0a0a] text-[16px] whitespace-pre">Participantes (0)</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[23.984px] relative shrink-0 w-[141.426px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[7.988px] items-center relative size-full">
        <Icon4 />
        <PrimitiveLabel3 />
      </div>
    </div>
  );
}

function Icon5() {
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

function Button1() {
  return (
    <div className="bg-white h-[31.992px] relative rounded-[8px] shrink-0 w-[186.875px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon5 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[105.73px] not-italic text-[#0a0a0a] text-[14px] text-center top-[4px] translate-x-[-50%] whitespace-pre">Adicionar Participante</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex h-[31.992px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container7 />
      <Button1 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[71.992px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[398.02px] not-italic text-[#717182] text-[14px] text-center top-[15.6px] translate-x-[-50%] w-[341px] whitespace-pre-wrap">{`Nenhum participante adicionado. Clique em "Adicionar Participante" para começar.`}</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[rgba(236,236,240,0.5)] h-[151px] relative rounded-[10px] shrink-0 w-[890px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[11.992px] items-start pb-[1.25px] pt-[17.246px] px-[17.246px] relative size-full">
        <Container6 />
        <Paragraph />
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="absolute left-0 size-[15.996px] top-[3.98px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d="M8.66455 3.33252H13.9966" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M8.66455 7.99805H13.9966" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M8.66455 12.6636H13.9966" id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p3a9bf82a} id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p10424680} id="Vector_5" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function PrimitiveLabel4() {
  return (
    <div className="h-[23.984px] relative shrink-0 w-[156.992px]" data-name="Primitive.label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon6 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[24px] left-[23.98px] not-italic text-[#0a0a0a] text-[16px] top-[-1.75px] whitespace-pre">Pontos de Agenda</p>
      </div>
    </div>
  );
}

function Icon7() {
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

function Button2() {
  return (
    <div className="bg-white h-[31.992px] relative rounded-[8px] shrink-0 w-[150.664px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon7 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[88.73px] not-italic text-[#0a0a0a] text-[14px] text-center top-[4px] translate-x-[-50%] whitespace-pre">Adicionar Ponto</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex h-[31.992px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <PrimitiveLabel4 />
      <Button2 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[71.992px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[427.02px] not-italic text-[#717182] text-[14px] text-center top-[25.61px] translate-x-[-50%] w-[381px] whitespace-pre-wrap">{`Nenhum ponto adicionado. Clique em "Adicionar Ponto" para começar.`}</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[rgba(236,236,240,0.5)] flex-[1_0_0] min-h-px min-w-px relative rounded-[10px] w-[890px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[11.992px] items-start pb-[1.25px] pt-[17.246px] px-[17.246px] relative size-full">
        <Container9 />
        <Paragraph1 />
      </div>
    </div>
  );
}

function PrimitiveLabel5() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Observações Adicionais</p>
    </div>
  );
}

function Textarea() {
  return (
    <div className="bg-[#f3f3f5] h-[63.984px] relative rounded-[8px] shrink-0 w-full" data-name="Textarea">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start px-[12px] py-[8px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#717182] text-[14px] whitespace-pre">Outras informações relevantes sobre a reunião...</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[86px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.988px] items-start relative size-full">
        <PrimitiveLabel5 />
        <Textarea />
      </div>
    </div>
  );
}

function PrimitiveLabel6() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Data da Reunião *</p>
    </div>
  );
}

function Icon8() {
  return (
    <div className="absolute left-[13.24px] size-[15.996px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g clipPath="url(#clip0_984_2932)" id="Icon">
          <path d="M5.33203 1.33301V3.99902" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M10.6641 1.33301V3.99902" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p3a0d1c0} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d="M1.99951 6.66504H13.9966" id="Vector_4" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
        <defs>
          <clipPath id="clip0_984_2932">
            <rect fill="white" height="15.9961" width="15.9961" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Icon8 />
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[45.21px] not-italic text-[#0a0a0a] text-[14px] top-[6.01px] whitespace-pre">Selecione a data</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[66px] items-start left-[0.02px] top-[0.23px] w-[408px]" data-name="Container">
      <PrimitiveLabel6 />
      <Button3 />
    </div>
  );
}

function PrimitiveLabel7() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Prioridade</p>
    </div>
  );
}

function PrimitiveSpan2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[46.133px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-pre">Normal</p>
      </div>
    </div>
  );
}

function Icon9() {
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

function PrimitiveButton2() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13.242px] py-[1.25px] relative size-full">
          <PrimitiveSpan2 />
          <Icon9 />
        </div>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[66px] items-start left-[478.02px] top-[1.23px] w-[339px]" data-name="Container">
      <PrimitiveLabel7 />
      <PrimitiveButton2 />
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[66px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container12 />
        <Container13 />
      </div>
    </div>
  );
}

function PrimitiveLabel8() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Hora de Início *</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start left-[7.02px] top-[0.25px] w-[220.078px]" data-name="Container">
      <PrimitiveLabel8 />
      <Input1 />
    </div>
  );
}

function PrimitiveLabel9() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Hora de Término *</p>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start left-[475.02px] top-[0.25px] w-[220.098px]" data-name="Container">
      <PrimitiveLabel9 />
      <Input2 />
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[58px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container15 />
        <Container16 />
      </div>
    </div>
  );
}

function PrimitiveLabel10() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Modalidade *</p>
    </div>
  );
}

function PrimitiveSpan3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[61.602px]" data-name="Primitive.span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-center whitespace-pre">Presencial</p>
      </div>
    </div>
  );
}

function Icon10() {
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

function PrimitiveButton3() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Primitive.button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13.242px] py-[1.25px] relative size-full">
          <PrimitiveSpan3 />
          <Icon10 />
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[66px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.988px] items-start relative size-full">
        <PrimitiveLabel10 />
        <PrimitiveButton3 />
      </div>
    </div>
  );
}

function PrimitiveLabel11() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] whitespace-pre">Local da Reunião</p>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] whitespace-pre">Ex: Sala de Reuniões 1, Escritório Principal</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[58px] relative shrink-0 w-[890px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.988px] items-start relative size-full">
        <PrimitiveLabel11 />
        <Input3 />
      </div>
    </div>
  );
}

function InternalMeetingForm() {
  return (
    <div className="content-stretch flex flex-col gap-[15.996px] h-[1020.742px] items-start relative shrink-0 w-full" data-name="InternalMeetingForm">
      <Container1 />
      <Container2 />
      <Container5 />
      <Container8 />
      <Container10 />
      <Container11 />
      <Container14 />
      <Container17 />
      <Container18 />
    </div>
  );
}

function CardContent() {
  return (
    <div className="absolute content-stretch flex flex-col h-[1057px] items-start left-[50.02px] overflow-clip px-[23.984px] py-0 top-[92.02px] w-[938px]" data-name="CardContent">
      <InternalMeetingForm />
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute bg-[#030213] content-stretch flex items-center justify-center left-[846.02px] px-[16px] py-[8px] rounded-[8px] top-[1146.02px]" data-name="Button">
      <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-pre">Agendar Reunião</p>
    </div>
  );
}

function MeetinternalForm() {
  return (
    <div className="content-stretch flex flex-col gap-[23.984px] h-[1182px] items-start relative shrink-0 w-full" data-name="MeetinternalForm">
      <Container />
      <CardContent />
      <Button4 />
    </div>
  );
}

export default function MainContent() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pl-[23.984px] pr-[42.734px] pt-[23.984px] relative size-full" data-name="Main Content">
      <MeetinternalForm />
    </div>
  );
}