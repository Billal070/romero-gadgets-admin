/* ============================================================
   ROMERO GADGETS — Shared client-side PDF invoice builder
   Dependency-free: generates a valid PDF 1.4 file (A4) using
   built-in Helvetica fonts only. Same design is used by the
   storefront (order success + account) and the admin panel.

   Input contract (all numbers are plain Numbers):
   {
     orderNumber, dateStr, customerName, phone,
     addressLines: [String],
     items: [{ name, qty, unitPrice, lineTotal }],
     subtotal, discount, deliveryFee, total,
     paymentLabel, statusLabel
   }
   ============================================================ */

const InvoicePdf = (() => {
  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 48;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const NAVY = [0.04, 0.12, 0.27];
  const BLUE = [0.15, 0.39, 0.92];
  const INK = [0.10, 0.10, 0.12];
  const MUTED = [0.42, 0.45, 0.50];
  const LINE = [0.88, 0.90, 0.93];
  const ROW_SHADE = [0.95, 0.96, 0.98];

  // Whole BDT: invoices never show fractional amounts.
  const money = (n) => 'BDT ' + Math.round(Number(n || 0)).toLocaleString('en-US');

  // Keep every emitted byte inside WinAnsi (single-byte) range so
  // xref offsets stay exact. Non-latin glyphs become '?'.
  const safe = (value) => String(value ?? '').split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code === 0x09 || code === 0x0a || code === 0x0d) return ' ';
    return code >= 0x20 && code <= 0xff ? ch : '?';
  }).join('');

  const esc = (value) => safe(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const col = ([r, g, b]) => `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;

  const charWidth = (font, size) => size * (font === 'B' ? 0.58 : 0.54);

  const wrap = (text, font, size, maxWidth) => {
    const words = safe(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const trial = line ? line + ' ' + word : word;
      if (trial.length * charWidth(font, size) <= maxWidth || !line) line = trial;
      else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  };

  function Page() {
    const ops = [];
    let y = PAGE_H - MARGIN;
    const text = (x, yy, font, size, str, color) => {
      ops.push(`${col(color || INK)} rg`);
      ops.push(`BT /F${font === 'B' ? 2 : 1} ${size} Tf ${(x).toFixed(1)} ${(yy).toFixed(1)} Td (${esc(str)}) Tj ET`);
    };
    const right = (xRight, yy, font, size, str, color) => {
      const w = safe(str).length * charWidth(font, size);
      text(xRight - w, yy, font, size, str, color);
    };
    const rect = (x, yy, w, h, color, fill) => {
      ops.push(`${col(color)} ${fill === false ? 'RG' : 'rg'}`);
      ops.push(`${x.toFixed(1)} ${yy.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re ${fill === false ? 'S' : 'f'}`);
    };
    const rule = (yy) => {
      ops.push(`${col(LINE)} RG 0.8 w`);
      ops.push(`${MARGIN.toFixed(1)} ${yy.toFixed(1)} m ${CONTENT_W.toFixed(1)} 0 l S`);
    };
    return { ops, getY: () => y, setY: (v) => { y = v; }, text, right, rect, rule };
  }

  const COLS = () => {
    const x = MARGIN;
    const total = x + CONTENT_W;
    // product | qty | unit | amount
    return { product: x, qty: x + CONTENT_W - 190, unit: x + CONTENT_W - 120, amount: total };
  };

  function headerBlock(p, order) {
    // Navy brand bar
    p.rect(0, PAGE_H - 92, PAGE_W, 92, NAVY);
    p.text(MARGIN, PAGE_H - 48, 'B', 19, 'ROMERO GADGETS', [1, 1, 1]);
    p.text(MARGIN, PAGE_H - 64, 'R', 9.5, 'Where Everyday Meets Smart.', [0.75, 0.82, 0.95]);
    p.right(PAGE_W - MARGIN, PAGE_H - 44, 'B', 16, 'INVOICE', [1, 1, 1]);
    p.right(PAGE_W - MARGIN, PAGE_H - 60, 'R', 10, order.orderNumber || '', [1, 1, 1]);
    p.setY(PAGE_H - 118);
    p.text(MARGIN, p.getY(), 'R', 10, `Order date: ${order.dateStr || ''}`, MUTED);
    p.right(PAGE_W - MARGIN, p.getY(), 'R', 10, `Status: ${order.statusLabel || ''}`, MUTED);
    p.setY(p.getY() - 26);
    p.text(MARGIN, p.getY(), 'B', 11, 'Bill To', NAVY);
    p.setY(p.getY() - 15);
    p.text(MARGIN, p.getY(), 'B', 10.5, order.customerName || '', INK);
    p.setY(p.getY() - 14);
    (order.addressLines || []).forEach(line => {
      p.text(MARGIN, p.getY(), 'R', 9.5, line, MUTED);
      p.setY(p.getY() - 13);
    });
    p.setY(p.getY() - 6);
  }

  function tableHead(p) {
    const c = COLS();
    const y = p.getY();
    p.rect(MARGIN, y - 18, CONTENT_W, 20, ROW_SHADE);
    p.text(c.product, y - 4, 'B', 9, 'PRODUCT', NAVY);
    p.text(c.qty, y - 4, 'B', 9, 'QTY', NAVY);
    p.text(c.unit, y - 4, 'B', 9, 'UNIT PRICE', NAVY);
    p.right(c.amount, y - 4, 'B', 9, 'AMOUNT', NAVY);
    p.setY(y - 24);
  }

  function itemRow(p, item) {
    const c = COLS();
    const lines = wrap(item.name, 'R', 9.5, (c.qty - c.product) - 8);
    const rowH = Math.max(lines.length * 13, 16) + 8;
    if (p.getY() - rowH < MARGIN + 120) return false; // next page
    const top = p.getY();
    lines.forEach((line, i) => {
      p.text(c.product, top - 12 - i * 13, 'R', 9.5, line, INK);
    });
    const midY = top - 12;
    p.text(c.qty, midY, 'R', 9.5, String(item.qty), INK);
    p.text(c.unit, midY, 'R', 9.5, money(item.unitPrice), INK);
    p.right(c.amount, midY, 'R', 9.5, money(item.lineTotal), INK);
    p.setY(top - rowH);
    p.rule(p.getY() + 2);
    p.setY(p.getY() - 8);
    return true;
  }

  function totalsBlock(p, order) {
    const need = 110;
    if (p.getY() - need < MARGIN) return false;
    const xLabel = MARGIN + CONTENT_W - 220;
    const xVal = MARGIN + CONTENT_W;
    const row = (label, value, bold) => {
      p.text(xLabel, p.getY(), bold ? 'B' : 'R', bold ? 11 : 10, label, bold ? NAVY : MUTED);
      p.right(xVal, p.getY(), bold ? 'B' : 'R', bold ? 11 : 10, value, bold ? NAVY : INK);
      p.setY(p.getY() - 16);
    };
    row('Subtotal', money(order.subtotal), false);
    if (Number(order.discount)) row('Discount', '- ' + money(order.discount), false);
    row('Delivery fee', Number(order.deliveryFee) ? money(order.deliveryFee) : 'FREE', false);
    p.setY(p.getY() - 2);
    p.rect(xLabel - 8, p.getY() - 20, 228, 26, BLUE);
    p.text(xLabel, p.getY() - 3, 'B', 11, 'Grand Total', [1, 1, 1]);
    p.right(xVal, p.getY() - 3, 'B', 11, money(order.total), [1, 1, 1]);
    p.setY(p.getY() - 34);
    p.text(MARGIN, p.getY(), 'R', 9.5, `Payment: ${order.paymentLabel || 'Cash on Delivery'}`, MUTED);
    p.setY(p.getY() - 14);
    p.text(MARGIN, p.getY(), 'R', 9, 'Thank you for shopping with ROMERO GADGETS.', MUTED);
    return true;
  }

  const build = (raw) => {
    const order = {
      orderNumber: safe(raw.orderNumber || 'N/A'),
      dateStr: safe(raw.dateStr || ''),
      customerName: safe(raw.customerName || ''),
      addressLines: (raw.addressLines || []).map(safe),
      items: (raw.items || []).map(i => ({
        name: safe(i.name || ''),
        qty: Number(i.qty) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        lineTotal: Number(i.lineTotal ?? (Number(i.qty) || 0) * (Number(i.unitPrice) || 0)),
      })),
      subtotal: Number(raw.subtotal) || 0,
      discount: Number(raw.discount) || 0,
      deliveryFee: Number(raw.deliveryFee) || 0,
      total: Number(raw.total) || 0,
      paymentLabel: safe(raw.paymentLabel || 'Cash on Delivery'),
      statusLabel: safe(raw.statusLabel || ''),
    };

    const pages = [];
    let p = Page();
    pages.push(p);
    headerBlock(p, order);
    tableHead(p);
    order.items.forEach(item => {
      if (!itemRow(p, item)) {
        p = Page();
        pages.push(p);
        p.setY(PAGE_H - MARGIN - 8);
        tableHead(p);
        if (!itemRow(p, item)) {
          // Single row taller than a page: force it anyway.
          itemRow(p, { ...item, name: item.name.slice(0, 120) });
        }
      }
    });
    if (!totalsBlock(p, order)) {
      p = Page();
      pages.push(p);
      p.setY(PAGE_H - MARGIN - 8);
      totalsBlock(p, order);
    }

    // ---- assemble PDF ----
    const enc = new TextEncoder();
    const chunks = [];
    let offset = 0;
    const offsets = [0];
    const push = (str) => {
      const bytes = enc.encode(str);
      chunks.push(bytes);
      offset += bytes.length;
    };
    const pushBytes = (bytes) => {
      chunks.push(bytes);
      offset += bytes.length;
    };

    const contents = pages.map(pg => enc.encode(pg.ops.join('\n')));
    // 1 catalog, 2 pages, 3.. page objs, then fonts, then contents
    const nPages = pages.length;
    const pageObjNums = [];
    for (let i = 0; i < nPages; i++) pageObjNums.push(3 + i);
    const fontReg = 3 + nPages;
    const fontBold = 4 + nPages;
    const contentNums = [];
    for (let i = 0; i < nPages; i++) contentNums.push(5 + nPages + i);
    const totalObjs = 4 + nPages * 2;

    push('%PDF-1.4\n');
    const begin = (n) => { offsets[n] = offset; push(`${n} 0 obj\n`); };
    const end = () => push('endobj\n');

    begin(1);
    push('<< /Type /Catalog /Pages 2 0 R >>\n');
    end();
    begin(2);
    push(`<< /Type /Pages /Kids [${pageObjNums.map(n => `${n} 0 R`).join(' ')}] /Count ${nPages} >>\n`);
    end();
    pages.forEach((pg, i) => {
      begin(pageObjNums[i]);
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentNums[i]} 0 R /Resources << /Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >> >> >>\n`);
      end();
    });
    begin(fontReg);
    push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n');
    end();
    begin(fontBold);
    push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\n');
    end();
    contents.forEach((bytes, i) => {
      begin(contentNums[i]);
      push(`<< /Length ${bytes.length} >>\nstream\n`);
      pushBytes(bytes);
      push('\nendstream\n');
      end();
    });

    const xrefAt = offset;
    push(`xref\n0 ${totalObjs + 1}\n`);
    push('0000000000 65535 f \n');
    for (let n = 1; n <= totalObjs; n++) {
      push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
    }
    push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
    return new Uint8Array(chunks.reduce((acc, b) => {
      const out = new Uint8Array(acc.length + b.length);
      out.set(acc, 0);
      out.set(b, acc.length);
      return out;
    }, new Uint8Array(0)));
  };

  const fileName = (orderNumber) => {
    const clean = String(orderNumber || 'order').replace(/[^A-Za-z0-9-]+/g, '');
    return `ROMERO-Invoice-${clean || 'order'}.pdf`;
  };

  const download = (order) => {
    const bytes = build(order);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName(order.orderNumber);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    return a.download;
  };

  return { build, download, fileName };
})();

export { InvoicePdf };
