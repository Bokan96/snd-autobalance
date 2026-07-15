"""
Extract hero and item icons from the Slice and Dice tier list xlsx.

Output:
  icons/heroes/<HeroName>.png
  icons/items/<ItemName>.png
"""
import zipfile, xml.etree.ElementTree as ET, os, re

XLSX = 'guides/Slice and Dice 3.1 Unfair Tier list.xlsx'
z = zipfile.ZipFile(XLSX)

NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

def col_letter_to_index(col_str):
    result = 0
    for ch in col_str.upper():
        result = result * 26 + (ord(ch) - ord('A') + 1)
    return result - 1

def safe_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name)

def parse_drawing(drawing_path, rels_path):
    """Return dict: (row_0based, col_0based) -> image_filename_in_zip"""
    rels_xml = z.read(rels_path)
    rels_root = ET.fromstring(rels_xml)
    rid_to_target = {}
    for rel in rels_root:
        rid = rel.attrib.get('Id')
        target = rel.attrib.get('Target')
        rid_to_target[rid] = target

    drawing_xml = z.read(drawing_path)
    drawing_root = ET.fromstring(drawing_xml)

    pos_to_img = {}
    for anchor in drawing_root:
        tag = anchor.tag.split('}')[-1]
        if tag not in ('twoCellAnchor', 'oneCellAnchor'):
            continue
        from_el = anchor.find(f'{{{NS_A}}}from')
        if from_el is None:
            continue
        row_el = from_el.find(f'{{{NS_A}}}row')
        col_el = from_el.find(f'{{{NS_A}}}col')
        if row_el is None or col_el is None:
            continue
        row = int(row_el.text)
        col = int(col_el.text)

        pic = anchor.find(f'.//{{{NS_A}}}blipFill')
        if pic is None:
            continue
        blip = pic.find('{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
        if blip is None:
            for child in pic:
                if 'blip' in child.tag.lower():
                    blip = child
                    break
        if blip is None:
            continue

        rid = blip.attrib.get(f'{{{NS_R}}}embed')
        if rid and rid in rid_to_target:
            target = rid_to_target[rid]
            img_path = 'xl/media/' + target.split('/')[-1]
            pos_to_img[(row, col)] = img_path

    return pos_to_img

def parse_sheet_names(sheet_path, name_col, start_row):
    """Return dict: row_0based -> name string"""
    sheet_xml = z.read(sheet_path)
    root = ET.fromstring(sheet_xml)

    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_xml = z.read('xl/sharedStrings.xml')
        ss_root = ET.fromstring(ss_xml)
        for si in ss_root:
            texts = []
            for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                if t.text:
                    texts.append(t.text)
            shared_strings.append(''.join(texts))

    row_to_name = {}
    for row_el in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_idx = int(row_el.attrib.get('r', 0)) - 1
        if row_idx < start_row:
            continue
        for cell_el in row_el:
            ref = cell_el.attrib.get('r', '')
            col_letters = ''.join(c for c in ref if c.isalpha())
            col_idx = col_letter_to_index(col_letters)
            if col_idx != name_col:
                continue
            t_attr = cell_el.attrib.get('t', '')
            v_el = cell_el.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            if v_el is None or v_el.text is None:
                continue
            if t_attr == 's':
                name = shared_strings[int(v_el.text)]
            else:
                name = v_el.text
            row_to_name[row_idx] = name.strip()
    return row_to_name

def extract_icons(drawing_path, rels_path, sheet_path, name_col, start_row, icon_col, out_folder):
    """Match images at icon_col to names at name_col and save to out_folder."""
    os.makedirs(out_folder, exist_ok=True)
    pos_to_img = parse_drawing(drawing_path, rels_path)
    row_to_name = parse_sheet_names(sheet_path, name_col, start_row)

    saved = 0
    skipped = 0
    for row, name in row_to_name.items():
        if not name or name.lower() == 'item':
            continue
        img_path = pos_to_img.get((row, icon_col))
        if img_path is None:
            skipped += 1
            continue
        try:
            img_data = z.read(img_path)
        except KeyError:
            skipped += 1
            continue
        ext = img_path.rsplit('.', 1)[-1]
        out_path = os.path.join(out_folder, f"{safe_filename(name)}.{ext}")
        with open(out_path, 'wb') as f:
            f.write(img_data)
        saved += 1

    print(f"  Saved {saved} icons to '{out_folder}' (skipped {skipped})")

# --- Heroes ---
print("Extracting hero icons...")
extract_icons(
    drawing_path='xl/drawings/drawing4.xml',
    rels_path='xl/drawings/_rels/drawing4.xml.rels',
    sheet_path='xl/worksheets/sheet4.xml',
    name_col=3,     # Column D = hero name
    start_row=4,    # Row 5 onwards (0-indexed)
    icon_col=2,     # Column C = icon
    out_folder='icons/heroes'
)

# --- Items ---
print("Extracting item icons...")
extract_icons(
    drawing_path='xl/drawings/drawing5.xml',
    rels_path='xl/drawings/_rels/drawing5.xml.rels',
    sheet_path='xl/worksheets/sheet5.xml',
    name_col=0,     # Column A = item name
    start_row=7,    # Row 8 onwards (0-indexed), skip header
    icon_col=2,     # Column C = icon
    out_folder='icons/items'
)

print("Done!")
