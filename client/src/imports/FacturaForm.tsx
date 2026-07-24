import svgPaths from "./svg-wsf9b5wvl3";

function Icon() {
  return (
    <div className="absolute left-0 size-[23.984px] top-[6px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.9844 23.9844">
        <g id="Icon">
          <path d={svgPaths.p2fd78bc0} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9987" />
          <path d={svgPaths.p1c82d600} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9987" />
          <path d="M11.9922 17.4886V6.49577" id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9987" />
        </g>
      </svg>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[35.996px] relative shrink-0 w-full" data-name="Heading 1">
      <Icon />
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[36px] left-[31.97px] not-italic text-[#0a0a0a] text-[24px] text-nowrap top-[-2.75px]">Nova Factura</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[23.984px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[24px] left-0 not-italic text-[#717182] text-[16px] text-nowrap top-[-1.75px]">Registar nova factura de fornecedor</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[59.98px] relative shrink-0 w-[252.441px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph />
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
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[72.71px] not-italic text-[#0a0a0a] text-[14px] text-center text-nowrap top-[6.01px] translate-x-[-50%]">Cancelar</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[59.98px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Button />
    </div>
  );
}

function CardTitle() {
  return (
    <div className="h-[15.996px] relative shrink-0 w-[1315.566px]" data-name="CardTitle">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#0a0a0a] text-[16px] text-nowrap top-[-2.75px]">Informações do Fornecedor</p>
      </div>
    </div>
  );
}

function PrimitiveLabel() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Fornecedor *</p>
    </div>
  );
}

function Option() {
  return <div className="absolute left-[-305.21px] size-0 top-[-201.15px]" data-name="Option" />;
}

function Option1() {
  return <div className="absolute left-[-305.21px] size-0 top-[-201.15px]" data-name="Option" />;
}

function Option2() {
  return <div className="absolute left-[-305.21px] size-0 top-[-201.15px]" data-name="Option" />;
}

function Option3() {
  return <div className="absolute left-[-305.21px] size-0 top-[-201.15px]" data-name="Option" />;
}

function Dropdown() {
  return (
    <div className="bg-white h-[39.727px] relative rounded-[8px] shrink-0 w-full" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Option />
      <Option1 />
      <Option2 />
      <Option3 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-0 top-0 w-[649.785px]" data-name="Container">
      <PrimitiveLabel />
      <Dropdown />
    </div>
  );
}

function PrimitiveLabel1() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Nº Factura Fornecedor *</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap">Ex: FT2026/001</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-[665.78px] top-0 w-[649.785px]" data-name="Container">
      <PrimitiveLabel1 />
      <Input />
    </div>
  );
}

function FacturaForm1() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[1315.566px]" data-name="FacturaForm">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-white h-[158.164px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="content-stretch flex flex-col gap-[29.98px] items-start pl-[25.234px] pr-[1.25px] py-[25.234px] relative size-full">
        <CardTitle />
        <FacturaForm1 />
      </div>
    </div>
  );
}

function CardTitle1() {
  return (
    <div className="absolute h-[15.996px] left-[25.23px] top-[25.23px] w-[1315.566px]" data-name="CardTitle">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#0a0a0a] text-[16px] text-nowrap top-[-2.75px]">Datas e Condições</p>
    </div>
  );
}

function PrimitiveLabel2() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Data de Emissão *</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start left-0 top-0 w-[427.852px]" data-name="Container">
      <PrimitiveLabel2 />
      <Input1 />
    </div>
  );
}

function PrimitiveLabel3() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Data de Vencimento *</p>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start left-[443.85px] top-0 w-[427.852px]" data-name="Container">
      <PrimitiveLabel3 />
      <Input2 />
    </div>
  );
}

function PrimitiveLabel4() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Data de Recebimento *</p>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start left-[887.7px] top-0 w-[427.871px]" data-name="Container">
      <PrimitiveLabel4 />
      <Input3 />
    </div>
  );
}

function FacturaForm2() {
  return (
    <div className="h-[57.988px] relative shrink-0 w-full" data-name="FacturaForm">
      <Container4 />
      <Container5 />
      <Container6 />
    </div>
  );
}

function PrimitiveLabel5() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Moeda *</p>
    </div>
  );
}

function Option4() {
  return <div className="absolute left-[-305.21px] size-0 top-[-457.29px]" data-name="Option" />;
}

function Option5() {
  return <div className="absolute left-[-305.21px] size-0 top-[-457.29px]" data-name="Option" />;
}

function Option6() {
  return <div className="absolute left-[-305.21px] size-0 top-[-457.29px]" data-name="Option" />;
}

function Dropdown1() {
  return (
    <div className="bg-white h-[39.727px] relative rounded-[8px] shrink-0 w-full" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Option4 />
      <Option5 />
      <Option6 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-0 top-0 w-[649.785px]" data-name="Container">
      <PrimitiveLabel5 />
      <Dropdown1 />
    </div>
  );
}

function PrimitiveLabel6() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Condições de Pagamento</p>
    </div>
  );
}

function Input4() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap">Ex: 30 dias</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-[665.78px] top-0 w-[649.785px]" data-name="Container">
      <PrimitiveLabel6 />
      <Input4 />
    </div>
  );
}

function FacturaForm3() {
  return (
    <div className="h-[61.719px] relative shrink-0 w-full" data-name="FacturaForm">
      <Container7 />
      <Container8 />
    </div>
  );
}

function CardContent() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[15.996px] h-[159.688px] items-start left-[1.25px] px-[23.984px] py-0 top-[71.21px] w-[1363.535px]" data-name="CardContent">
      <FacturaForm2 />
      <FacturaForm3 />
    </div>
  );
}

function Card1() {
  return (
    <div className="bg-white h-[232.148px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <CardTitle1 />
      <CardContent />
    </div>
  );
}

function CardTitle2() {
  return (
    <div className="h-[15.996px] relative shrink-0 w-[111.211px]" data-name="CardTitle">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#0a0a0a] text-[16px] text-nowrap top-[-2.75px]">Itens da Factura</p>
      </div>
    </div>
  );
}

function Icon2() {
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

function Button1() {
  return (
    <div className="bg-[#030213] h-[31.992px] relative rounded-[8px] shrink-0 w-[143.477px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon2 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[86.98px] not-italic text-[14px] text-center text-nowrap text-white top-[4px] translate-x-[-50%]">Adicionar Item</p>
      </div>
    </div>
  );
}

function FacturaForm4() {
  return (
    <div className="absolute content-stretch flex h-[31.992px] items-center justify-between left-[25.23px] top-[25.23px] w-[1315.566px]" data-name="FacturaForm">
      <CardTitle2 />
      <Button1 />
    </div>
  );
}

function Text() {
  return (
    <div className="absolute h-[20px] left-[17.25px] top-[17.25px] w-[38.398px]" data-name="Text">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-0 not-italic text-[#0a0a0a] text-[14px] top-[-2px] w-[39px]">Item 1</p>
    </div>
  );
}

function PrimitiveLabel7() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Descrição *</p>
    </div>
  );
}

function Input5() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap">Descrição do item</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-0 top-0 w-[502.832px]" data-name="Container">
      <PrimitiveLabel7 />
      <Input5 />
    </div>
  );
}

function PrimitiveLabel8() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Quantidade *</p>
    </div>
  );
}

function Input6() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">1</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-[518.83px] top-0 w-[243.418px]" data-name="Container">
      <PrimitiveLabel8 />
      <Input6 />
    </div>
  );
}

function PrimitiveLabel9() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Preço Unit. *</p>
    </div>
  );
}

function Input7() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">0</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-[778.24px] top-0 w-[243.418px]" data-name="Container">
      <PrimitiveLabel9 />
      <Input7 />
    </div>
  );
}

function PrimitiveLabel10() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">IVA (%)</p>
    </div>
  );
}

function Option7() {
  return <div className="absolute left-[-1360.12px] size-0 top-[-700.66px]" data-name="Option" />;
}

function Option8() {
  return <div className="absolute left-[-1360.12px] size-0 top-[-700.66px]" data-name="Option" />;
}

function Option9() {
  return <div className="absolute left-[-1360.12px] size-0 top-[-700.66px]" data-name="Option" />;
}

function Dropdown2() {
  return (
    <div className="bg-white h-[39.727px] relative rounded-[8px] shrink-0 w-full" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Option7 />
      <Option8 />
      <Option9 />
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.988px] h-[61.719px] items-start left-[1037.66px] top-0 w-[243.418px]" data-name="Container">
      <PrimitiveLabel10 />
      <Dropdown2 />
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute h-[61.719px] left-[17.25px] top-[45.23px] w-[1281.074px]" data-name="Container">
      <Container10 />
      <Container11 />
      <Container12 />
      <Container13 />
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute content-stretch flex h-[18.75px] items-start left-0 top-0 w-[36.309px]" data-name="Text">
      <p className="basis-0 font-['Arial:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#717182] text-[14px]">Total:</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="absolute content-stretch flex h-[18.75px] items-start left-[36.31px] top-0 w-[47.617px]" data-name="Text">
      <p className="font-['Arial:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">0,00 Kz</p>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute h-[20px] left-[1214.39px] top-[118.95px] w-[83.926px]" data-name="Container">
      <Text1 />
      <Text2 />
    </div>
  );
}

function FacturaForm5() {
  return (
    <div className="h-[156.191px] relative rounded-[10px] shrink-0 w-full" data-name="FacturaForm">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Text />
      <Container9 />
      <Container14 />
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[54.844px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Subtotal:</p>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[20px] relative shrink-0 w-[45.605px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">0,00 Kz</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex h-[20px] items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Text3 />
      <Text4 />
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[20px] relative shrink-0 w-[56.934px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">IVA Total:</p>
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[45.605px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">0,00 Kz</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex h-[20px] items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Text5 />
      <Text6 />
    </div>
  );
}

function Text7() {
  return (
    <div className="h-[28.008px] relative shrink-0 w-[46.621px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Arial:Bold',sans-serif] leading-[28px] left-0 not-italic text-[#0a0a0a] text-[18px] text-nowrap top-[-1.75px]">Total:</p>
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[28.008px] relative shrink-0 w-[61.211px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Arial:Bold',sans-serif] leading-[28px] left-0 not-italic text-[#030213] text-[18px] text-nowrap top-[-1.75px]">0,00 Kz</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex h-[37.246px] items-start justify-between pb-0 pt-[9.238px] px-0 relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[1.25px_0px_0px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <Text7 />
      <Text8 />
    </div>
  );
}

function FacturaForm6() {
  return (
    <div className="content-stretch flex flex-col gap-[7.988px] h-[110.469px] items-start pb-0 pt-[17.246px] px-0 relative shrink-0 w-full" data-name="FacturaForm">
      <div aria-hidden="true" className="absolute border-[1.25px_0px_0px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none" />
      <Container15 />
      <Container16 />
      <Container17 />
    </div>
  );
}

function CardContent1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[15.996px] h-[306.641px] items-start left-[1.25px] px-[23.984px] py-0 top-[87.21px] w-[1363.535px]" data-name="CardContent">
      <FacturaForm5 />
      <FacturaForm6 />
    </div>
  );
}

function Card2() {
  return (
    <div className="bg-white h-[395.098px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <FacturaForm4 />
      <CardContent1 />
    </div>
  );
}

function CardTitle3() {
  return (
    <div className="absolute h-[15.996px] left-[25.23px] top-[25.23px] w-[1315.566px]" data-name="CardTitle">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#0a0a0a] text-[16px] text-nowrap top-[-2.75px]">Informações Adicionais</p>
    </div>
  );
}

function PrimitiveLabel11() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Descrição *</p>
    </div>
  );
}

function Input8() {
  return (
    <div className="bg-[#f3f3f5] h-[35.996px] relative rounded-[8px] shrink-0 w-full" data-name="Input2">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap">Descrição geral da factura</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function FacturaForm7() {
  return (
    <div className="content-stretch flex flex-col gap-[7.988px] h-[57.988px] items-start relative shrink-0 w-full" data-name="FacturaForm">
      <PrimitiveLabel11 />
      <Input8 />
    </div>
  );
}

function PrimitiveLabel12() {
  return (
    <div className="content-stretch flex h-[14.004px] items-center relative shrink-0 w-full" data-name="Primitive.label">
      <p className="font-['Arial:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-nowrap">Observações</p>
    </div>
  );
}

function Textarea() {
  return (
    <div className="bg-[#f3f3f5] h-[63.984px] relative rounded-[8px] shrink-0 w-full" data-name="Textarea">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start px-[12px] py-[8px] relative size-full">
          <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#717182] text-[14px] text-nowrap">Observações ou notas adicionais...</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function FacturaForm8() {
  return (
    <div className="content-stretch flex flex-col gap-[7.988px] h-[85.977px] items-start relative shrink-0 w-full" data-name="FacturaForm">
      <PrimitiveLabel12 />
      <Textarea />
    </div>
  );
}

function CardContent2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[15.996px] h-[183.945px] items-start left-[1.25px] px-[23.984px] py-0 top-[71.21px] w-[1363.535px]" data-name="CardContent">
      <FacturaForm7 />
      <FacturaForm8 />
    </div>
  );
}

function Card3() {
  return (
    <div className="bg-white h-[256.406px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <CardTitle3 />
      <CardContent2 />
    </div>
  );
}

function CardTitle4() {
  return (
    <div className="h-[15.996px] relative shrink-0 w-[1315.566px]" data-name="CardTitle">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-0 not-italic text-[#0a0a0a] text-[16px] text-nowrap top-[-2.75px]">Anexos</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[641.78px] size-[31.992px] top-[25.23px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31.9922 31.9922">
        <g id="Icon">
          <path d="M15.9961 3.99902V19.9951" id="Vector" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
          <path d={svgPaths.p13a97b80} id="Vector_2" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
          <path d={svgPaths.p1cbca840} id="Vector_3" stroke="var(--stroke-0, #717182)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66602" />
        </g>
      </svg>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-start left-[25.23px] top-[65.21px] w-[1265.098px]" data-name="Paragraph">
      <p className="basis-0 font-['Arial:Regular',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[#717182] text-[14px] text-center">Arraste ficheiros ou clique para fazer upload</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[15.977px] left-[25.23px] top-[93.2px] w-[1265.098px]" data-name="Paragraph">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[16px] left-[632.87px] not-italic text-[#717182] text-[12px] text-center top-[-1px] translate-x-[-50%] w-[195px]">Tamanho máximo: 10MB por ficheiro</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute bg-white border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid h-[31.992px] left-[581.91px] rounded-[8px] top-[121.17px] w-[151.719px]" data-name="Button">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[75.49px] not-italic text-[#0a0a0a] text-[14px] text-center text-nowrap top-[2.75px] translate-x-[-50%]">Selecionar Ficheiros</p>
    </div>
  );
}

function FileUpload() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[10px] shrink-0 w-[1315.566px]" data-name="FileUpload">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon3 />
        <Paragraph1 />
        <Paragraph2 />
        <Button2 />
      </div>
    </div>
  );
}

function Card4() {
  return (
    <div className="bg-white h-[274.844px] relative rounded-[14px] shrink-0 w-full" data-name="Card">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="content-stretch flex flex-col gap-[29.98px] items-start pl-[25.234px] pr-[1.25px] py-[25.234px] relative size-full">
        <CardTitle4 />
        <FileUpload />
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white h-[35.996px] relative rounded-[8px] shrink-0 w-[88.848px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[1.25px] border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[17.25px] py-[9.25px] relative size-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] text-center text-nowrap">Cancelar</p>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="absolute left-[11.99px] size-[15.996px] top-[10px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9961 15.9961">
        <g id="Icon">
          <path d={svgPaths.p46c6e00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p1060a440} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
          <path d={svgPaths.p1a29bb00} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33301" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#030213] h-[35.996px] relative rounded-[8px] shrink-0 w-[157.441px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon4 />
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[94.96px] not-italic text-[14px] text-center text-nowrap text-white top-[5.99px] translate-x-[-50%]">Registar Factura</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex gap-[7.988px] h-[35.996px] items-start justify-end relative shrink-0 w-full" data-name="Container">
      <Button3 />
      <Button4 />
    </div>
  );
}

export default function FacturaForm() {
  return (
    <div className="content-stretch flex flex-col gap-[23.984px] items-start relative size-full" data-name="FacturaForm">
      <Container />
      <Card />
      <Card1 />
      <Card2 />
      <Card3 />
      <Card4 />
      <Container18 />
    </div>
  );
}