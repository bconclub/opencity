from pathlib import Path
from fontTools.ttLib import TTFont as Font
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
KIT = Path(r'C:\Users\user\Documents\Codex\2026-09-14\this-is-a-claude-design-file\outputs\BCON Invoice')
OUT = ROOT / 'output' / 'pdf' / 'BCON_Club_Kiran_IT_PO_DRAFT.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

for name, weight in [('Regular', 400), ('Medium', 600), ('Bold', 800)]:
    destination = ROOT / 'work' / f'Anybody-PO-{name}.ttf'
    font = Font(KIT / 'fonts' / 'Anybody-VariableFont_wdth_wght.ttf')
    instantiateVariableFont(font, {'wght': weight, 'wdth': 100}, inplace=True)
    for record in font['name'].names:
        if record.nameID in (1, 4, 6):
            record.string = ('AnybodyPO' + name).encode(record.getEncoding())
    font.save(destination)
    pdfmetrics.registerFont(TTFont('AnybodyPO' + name, str(destination)))

c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('BCON Club | Kiran IT Solutions | Purchase Order Draft')
c.setAuthor('BCON Club')
W, H = A4
black = '#000000'
ink = '#141414'
gray = '#5c5c5c'
light = '#ececec'
accent = '#CDFC2E'


def rect(x, y, width, height, fill, stroke=None, radius=0):
    c.setFillColor(HexColor(fill))
    c.setStrokeColor(HexColor(stroke or fill))
    if radius:
        c.roundRect(x, H-y-height, width, height, radius, fill=1, stroke=bool(stroke))
    else:
        c.rect(x, H-y-height, width, height, fill=1, stroke=bool(stroke))


def text(x, y, value, size=10, font='Regular', color=ink, right=False):
    c.setFillColor(HexColor(color))
    c.setFont('AnybodyPO' + font, size)
    (c.drawRightString if right else c.drawString)(x, H-y-size, value)


def rule(y, x=38, end=W-38):
    c.setStrokeColor(HexColor(light))
    c.setLineWidth(.7)
    c.line(x, H-y, end, H-y)


rect(0, 0, W, 124, black)
c.drawImage(str(KIT / 'assets' / 'BCON-icon-neon.png'), 38, H-76, 40, 40, mask='auto')
text(90, 39, 'BCON', 18, 'Bold', '#ffffff')
text(151, 39, 'CLUB', 18, 'Bold', accent)
text(90, 65, 'HUMAN x AI · CREATIVE x PERFORMANCE x TECH', 6.7, 'Medium', '#aaaaaa')
text(W-38, 31, 'PURCHASE ORDER', 25, 'Bold', accent, True)
text(W-40, 69, 'DRAFT · FOR REVIEW', 8, 'Medium', '#a0a0a0', True)
text(W-40, 84, 'PO NO. TO BE ASSIGNED', 10, 'Bold', '#ffffff', True)

rect(0, 124, W, 29, '#f5f5f5')
text(38, 133, 'PREPARED', 7.5, 'Regular', '#909090')
text(91, 133, '28 SEP 2026', 8, 'Bold')
text(174, 133, '·', 8, 'Bold', accent)
text(186, 133, 'REF. KI/QO/26-27/92', 7.5, 'Regular', gray)

card_width = (W-92)/2
for x in (38, 54+card_width):
    rect(x, 180, card_width, 144, '#ffffff', light, 8)
text(54, 195, 'ISSUED BY', 7.5, 'Medium', '#909090')
text(54, 214, 'BCON Club', 11, 'Bold')
for i, value in enumerate([
    'No.8, Liss Arcade, Bannerghatta Main Road',
    'Bangalore, Karnataka 560076',
    'GSTIN: 29AQOPA1017H1Z3',
    'PAN: AQOPA1017H',
]):
    text(54, 236+i*16, value, 7.5 if i == 0 else 8.4, 'Regular', gray)

vendor_x = 70+card_width
text(vendor_x, 195, 'SUPPLIER', 7.5, 'Medium', '#909090')
text(vendor_x, 214, 'KIRAN IT SOLUTIONS', 11, 'Bold')
for i, value in enumerate([
    'No 8/2, 1st Floor, 1st Main Road',
    'M.C Layout, Vijayanagar, Bengaluru 560040',
    'GSTIN: 29AOZPV9414L1ZL',
    'info@kiranits.in',
]):
    text(vendor_x, 236+i*16, value, 7.8 if i == 1 else 8.4, 'Regular', gray)

for x, label, value in [
    (38, 'PO DATE', '28 Sep 2026'),
    (172, 'RENTAL TERM', 'To confirm'),
    (305, 'CURRENCY', 'INR'),
    (438, 'BASIS', 'Monthly rental'),
]:
    text(x, 350, label, 7, 'Medium', '#909090')
    text(x, 364, value, 9, 'Bold')
rule(392, 0, W)

text(38, 416, 'DESCRIPTION', 7.5, 'Bold')
text(321, 416, 'QTY / SAC', 7.5, 'Bold')
text(W-38, 416, 'AMOUNT', 7.5, 'Bold', ink, True)
rect(38, 438, W-76, 1.4, ink)
text(38, 451, 'Dell Precision 7910 desktop rental', 9.7, 'Medium')
text(38, 468, 'Dual Intel Xeon · 32 GB RAM · 512 GB + 1 TB · 4 GB graphics', 8.1, 'Regular', gray)
text(321, 451, '1 / 997316', 8.6, 'Regular', gray)
text(W-38, 451, 'INR 4,000', 10, 'Bold', ink, True)
rule(493)

rect(38, 514, 264, 170, '#fafafa', light, 8)
text(55, 530, 'ORDER & REVIEW NOTES', 7.5, 'Medium', '#909090')
rule(549, 55, 285)
text(55, 559, 'Delivery: 2-3 days after PO confirmation.', 7.9, 'Regular', gray)
text(55, 576, 'Rental dates: to confirm before issue.', 7.9, 'Regular', gray)
text(55, 593, 'Vendor requests prepaid rent and deposit.', 7.9, 'Regular', gray)
text(55, 617, 'Confirm equipment-value cheque, signed', 7.7, 'Regular', gray)
text(55, 631, 'agreement/seal, insurance, late interest,', 7.7, 'Regular', gray)
text(55, 645, 'damage and early-return terms before issue.', 7.7, 'Regular', gray)
text(55, 665, 'No signature or approval applied.', 7.7, 'Bold', ink)

text(326, 516, 'Monthly rent', 9.2, 'Regular', gray)
text(W-38, 516, 'INR 4,000', 9.2, 'Bold', ink, True)
text(326, 535, 'CGST 9% + SGST 9%', 8.7, 'Regular', gray)
text(W-38, 535, 'INR 720', 8.7, 'Bold', ink, True)
text(326, 554, 'Rent including GST', 9.2, 'Regular', gray)
text(W-38, 554, 'INR 4,720', 9.2, 'Bold', ink, True)
text(326, 573, 'Security deposit', 9.2, 'Regular', gray)
text(W-38, 573, 'INR 15,000', 9.2, 'Bold', ink, True)
rect(326, 610, W-364, 54, black, radius=8)
text(338, 626, 'TOTAL PER QUOTATION', 7.3, 'Medium', '#cccccc')
text(W-51, 622, 'INR 19,720', 14, 'Bold', accent, True)

text(38, 710, 'AUTHORIZATION', 7.5, 'Medium', '#909090')
text(38, 731, 'Authorized BCON Club signatory:', 8.7, 'Regular', gray)
c.setStrokeColor(HexColor(light))
c.line(211, H-743, 410, H-743)
text(430, 731, 'Date: __________', 8.7, 'Regular', gray)
rule(769)
text(38, 781, 'Draft based on Kiran IT Solutions quotation dated 28 Sep 2026.', 7.7, 'Regular', gray)
text(38, 796, 'Terms are for review; this draft has not been issued to supplier.', 7.7, 'Regular', gray)

c.showPage()
c.save()
print(OUT)
