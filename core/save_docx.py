import webview
from PIL import Image
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_ALIGN_VERTICAL, WD_ROW_HEIGHT_RULE
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm
from docx.shared import Pt, RGBColor

from core.handle_log import log
from core.handle_request import OutputBaseData
from core.save_images import SaveImage


class OutputWord(OutputBaseData):
    """
    輸出成word的資料
    """

    def __init__(self, request):
        super().__init__(request)
        self.layout_mode = request.get('layoutMode')
        raw_pages = request.get('pages', [])
        self.pages = raw_pages if isinstance(raw_pages, list) else []

        mode = request.get('mode', 1)
        try:
            parsed_mode = int(mode)
        except (TypeError, ValueError):
            parsed_mode = 1
        self.mode = parsed_mode if parsed_mode in {1, 2, 4, 6} else 1

        self.align_vertical = request.get('align_vertical')  # 垂直對齊
        self.font_size = int(request.get('font_size'))  # 字體大小

    def to_compressed_images(self) -> list[SaveImage]:
        """
        把所有圖片轉換成壓縮後的自訂圖片物件清單
        :return: 轉換成自訂python圖片的清單，並於過程中壓縮
        """
        images = []  # python 圖片的清單
        for index, file in enumerate(self.files):
            image = SaveImage(file)  # 逐一轉化成python自訂物件
            log().info(f'處理圖片：{index + 1}/{self.file_count}')
            _safe_update_progress(index)
            images.append(image)
        return images

    def to_dict(self):
        payload = {
            '標題': self.title,
            '檔案數': self.file_count,
            '模式': self.mode,
        }
        if self.layout_mode:
            payload['版型'] = self.layout_mode
        if self.pages is not None:
            payload['頁數'] = len(self.pages)
        return payload


def _safe_update_progress(value: int):
    if not getattr(webview, 'windows', None):
        return
    try:
        webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({value})")
    except Exception:
        log().debug('更新進度失敗，繼續輸出', exc_info=True)


def _width_twips(width_cm: int | float) -> str:
    return str(Cm(width_cm).twips)


def _set_cell_width(cell, width_cm: int | float):
    cell.width = Cm(width_cm)
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.tcW
    if tc_w is None:
        tc_w = OxmlElement('w:tcW')
        tc_pr.append(tc_w)
    tc_w.set(qn('w:w'), _width_twips(width_cm))
    tc_w.set(qn('w:type'), 'dxa')


def _set_table_grid_widths(table, widths_cm: list[int | float]):
    table.autofit = False
    tbl_grid = table._tbl.tblGrid
    if tbl_grid is None:
        tbl_grid = OxmlElement('w:tblGrid')
        table._tbl.insert(0, tbl_grid)

    for grid_col in list(tbl_grid):
        tbl_grid.remove(grid_col)

    for width_cm in widths_cm:
        grid_col = OxmlElement('w:gridCol')
        grid_col.set(qn('w:w'), _width_twips(width_cm))
        tbl_grid.append(grid_col)


def _set_equal_table_column_widths(table, column_count: int, width_cm: int | float):
    _set_table_grid_widths(table, [width_cm] * column_count)
    for col in range(column_count):
        for cell in table.columns[col].cells:
            _set_cell_width(cell, width_cm)


def _set_row_heights(table, heights_cm: list[int | float]):
    for row, height_cm in zip(table.rows, heights_cm, strict=False):
        row.height = Cm(height_cm)
        row.height_rule = WD_ROW_HEIGHT_RULE.EXACTLY


def _normalize_slot_list(page: dict, expected_template: str) -> list[dict]:
    if not isinstance(page, dict) or page.get('template') != expected_template:
        return []

    slots = page.get('slots', [])
    return [slot for slot in slots if isinstance(slot, dict)]


def _build_image_map(images: list[SaveImage]) -> dict[str, SaveImage]:
    return {getattr(image, 'id', ''): image for image in images if getattr(image, 'id', None)}


def _resolve_slot_image(images_by_id: dict[str, SaveImage], slot: dict | None) -> SaveImage | None:
    if not slot:
        return None

    item_id = slot.get('itemId')
    if not isinstance(item_id, str):
        return None

    return images_by_id.get(item_id)


def _write_auto_slot(
    align,
    image: SaveImage | None,
    image_cell,
    number_cell,
    remark_cell,
    image_index: int,
    max_height: int | float,
    max_width: int | float,
    number_width_cm: int | float | None = None,
    remark_width_cm: int | float | None = None,
) -> int:
    if number_width_cm is not None:
        _set_cell_width(number_cell, number_width_cm)
    if remark_width_cm is not None:
        _set_cell_width(remark_cell, remark_width_cm)

    if image is None:
        number_cell.text = ''
        number_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        number_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        remark_cell.text = ''
        if align == 'top':
            remark_cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
        elif align == 'center':
            remark_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        return image_index

    handle_table_write(
        image=image,
        align=align,
        index=image_index,
        image_cell=image_cell,
        number_cell=number_cell,
        remark_cell=remark_cell,
        max_height=max_height,
        max_width=max_width,
    )

    return image_index + 1


def _write_horizontal_auto_slot(
    align,
    image: SaveImage | None,
    image_cell,
    number_cell,
    remark_cell,
    image_index: int,
    max_height: int | float,
    max_width: int | float,
    writable_width_cm: int | float = 15.5,
    number_width_cm: int | float = 1.8,
) -> int:
    return _write_auto_slot(
        align,
        image=image,
        image_cell=image_cell,
        number_cell=number_cell,
        remark_cell=remark_cell,
        image_index=image_index,
        max_height=max_height,
        max_width=max_width,
        number_width_cm=number_width_cm,
        remark_width_cm=writable_width_cm - number_width_cm,
    )


def _append_landscape_2_table(
    doc,
    align,
    images_by_id: dict[str, SaveImage],
    slots: list[dict],
    image_index: int,
) -> int:
    table = doc.add_table(rows=4, cols=2, style='Table Grid')
    table.rows[0].height = Cm(9)
    table.rows[1].height = Cm(2)
    table.rows[2].height = Cm(9)
    table.rows[3].height = Cm(2)

    _set_table_grid_widths(table, [1.8, 15.2])
    for cell in table.columns[0].cells:
        _set_cell_width(cell, 1.8)
    for cell in table.columns[1].cells:
        _set_cell_width(cell, 15.2)

    table.cell(0, 0).merge(table.cell(0, 1))
    table.cell(2, 0).merge(table.cell(2, 1))

    first_image = _resolve_slot_image(images_by_id, slots[0] if len(slots) > 0 else None)
    image_index = _write_horizontal_auto_slot(
        align,
        image=first_image,
        image_cell=table.cell(0, 0),
        number_cell=table.cell(1, 0),
        remark_cell=table.cell(1, 1),
        image_index=image_index,
        max_height=9,
        max_width=15,
    )

    second_image = _resolve_slot_image(images_by_id, slots[1] if len(slots) > 1 else None)
    image_index = _write_horizontal_auto_slot(
        align,
        image=second_image,
        image_cell=table.cell(2, 0),
        number_cell=table.cell(3, 0),
        remark_cell=table.cell(3, 1),
        image_index=image_index,
        max_height=9,
        max_width=15,
    )
    return image_index


def _append_portrait_large_2_table(
    doc,
    align,
    images_by_id: dict[str, SaveImage],
    slots: list[dict],
    image_index: int,
) -> int:
    table = doc.add_table(rows=3, cols=2, style='Table Grid')
    table.rows[0].height = Cm(18.2)
    table.rows[1].height = Cm(0.8)
    table.rows[2].height = Cm(3.5)

    for cell in table.columns[0].cells:
        cell.width = Cm(7.8)
    for cell in table.columns[1].cells:
        cell.width = Cm(7.8)

    left = _resolve_slot_image(images_by_id, slots[0] if len(slots) > 0 else None)
    image_index = _write_auto_slot(
        align,
        image=left,
        image_cell=table.cell(0, 0),
        number_cell=table.cell(1, 0),
        remark_cell=table.cell(2, 0),
        image_index=image_index,
        max_height=18,
        max_width=7.6,
    )

    right = _resolve_slot_image(images_by_id, slots[1] if len(slots) > 1 else None)
    image_index = _write_auto_slot(
        align,
        image=right,
        image_cell=table.cell(0, 1),
        number_cell=table.cell(1, 1),
        remark_cell=table.cell(2, 1),
        image_index=image_index,
        max_height=18,
        max_width=7.6,
    )
    return image_index


def _append_portrait_small_6_table(
    doc,
    align,
    images_by_id: dict[str, SaveImage],
    slots: list[dict],
    image_index: int,
) -> int:
    table = doc.add_table(rows=6, cols=3, style='Table Grid')
    _set_row_heights(table, [7.2, 0.6, 3.2, 7.2, 0.6, 3.2])

    _set_equal_table_column_widths(table, 3, 5.2)

    for slot_index in range(6):
        slot = slots[slot_index] if slot_index < len(slots) else None
        image = _resolve_slot_image(images_by_id, slot)
        block_base = 0 if slot_index < 3 else 3
        col = slot_index % 3

        image_index = _write_auto_slot(
            align,
            image=image,
            image_cell=table.cell(block_base, col),
            number_cell=table.cell(block_base + 1, col),
            remark_cell=table.cell(block_base + 2, col),
            image_index=image_index,
            max_height=7,
            max_width=5,
        )
    return image_index


def _append_mixed_landscape1_small3_table(
    doc,
    align,
    images_by_id: dict[str, SaveImage],
    slots: list[dict],
    image_index: int,
) -> int:
    table = doc.add_table(rows=5, cols=3, style='Table Grid')
    _set_row_heights(table, [8.2, 3.2, 7.6, 0.6, 3.2])

    _set_equal_table_column_widths(table, 3, 5.2)

    table.cell(0, 0).merge(table.cell(0, 1)).merge(table.cell(0, 2))
    table.cell(1, 1).merge(table.cell(1, 2))

    landscape = _resolve_slot_image(images_by_id, slots[0] if len(slots) > 0 else None)
    image_index = _write_horizontal_auto_slot(
        align,
        image=landscape,
        image_cell=table.cell(0, 0),
        number_cell=table.cell(1, 0),
        remark_cell=table.cell(1, 1),
        image_index=image_index,
        max_height=8,
        max_width=15,
    )

    for index in range(3):
        slot = slots[index + 1] if len(slots) > index + 1 else None
        image = _resolve_slot_image(images_by_id, slot)
        image_index = _write_auto_slot(
            align,
            image=image,
            image_cell=table.cell(2, index),
            number_cell=table.cell(3, index),
            remark_cell=table.cell(4, index),
            image_index=image_index,
            max_height=7.4,
            max_width=5.2,
        )
    return image_index


def _append_mixed_small3_landscape1_table(
    doc,
    align,
    images_by_id: dict[str, SaveImage],
    slots: list[dict],
    image_index: int,
) -> int:
    table = doc.add_table(rows=5, cols=3, style='Table Grid')
    _set_row_heights(table, [7.6, 0.6, 3.2, 8.2, 3.2])

    _set_equal_table_column_widths(table, 3, 5.2)

    for index in range(3):
        slot = slots[index] if len(slots) > index else None
        image = _resolve_slot_image(images_by_id, slot)
        image_index = _write_auto_slot(
            align,
            image=image,
            image_cell=table.cell(0, index),
            number_cell=table.cell(1, index),
            remark_cell=table.cell(2, index),
            image_index=image_index,
            max_height=7.4,
            max_width=5.2,
        )

    table.cell(3, 0).merge(table.cell(3, 1)).merge(table.cell(3, 2))
    table.cell(4, 1).merge(table.cell(4, 2))
    landscape = _resolve_slot_image(images_by_id, slots[3] if len(slots) > 3 else None)
    image_index = _write_horizontal_auto_slot(
        align,
        image=landscape,
        image_cell=table.cell(3, 0),
        number_cell=table.cell(4, 0),
        remark_cell=table.cell(4, 1),
        image_index=image_index,
        max_height=8,
        max_width=15,
    )
    return image_index


def _render_auto_collage_pages(data: OutputWord, images: list[SaveImage], doc):
    images_by_id = _build_image_map(images)
    image_count = len(images)
    rendered_page_count = 0
    image_index = 1

    for page in data.pages:
        if not isinstance(page, dict):
            continue

        template = page.get('template')

        rendered = False

        if template == 'landscape-2':
            image_index = _append_landscape_2_table(doc, data.align_vertical, images_by_id, _normalize_slot_list(page, 'landscape-2'), image_index)
            rendered = True
        elif template == 'portrait-large-2':
            image_index = _append_portrait_large_2_table(doc, data.align_vertical, images_by_id, _normalize_slot_list(page, 'portrait-large-2'), image_index)
            rendered = True
        elif template == 'portrait-small-6':
            image_index = _append_portrait_small_6_table(doc, data.align_vertical, images_by_id, _normalize_slot_list(page, 'portrait-small-6'), image_index)
            rendered = True
        elif template == 'mixed-landscape1-small3':
            image_index = _append_mixed_landscape1_small3_table(doc, data.align_vertical, images_by_id, _normalize_slot_list(page, 'mixed-landscape1-small3'), image_index)
            rendered = True
        elif template == 'mixed-small3-landscape1':
            image_index = _append_mixed_small3_landscape1_table(doc, data.align_vertical, images_by_id, _normalize_slot_list(page, 'mixed-small3-landscape1'), image_index)
            rendered = True
        else:
            log().warning(f'不支援的版型：{template}')

        if rendered:
            rendered_page_count += 1
            if image_count:
                _safe_update_progress(image_count)

    if rendered_page_count == 0:
        log().warning('layoutMode 已設定為 auto-collage-v1，但沒有可識別頁面，改用舊版版式')
        return _build_legacy_layout(doc, data, images)

    return doc


def _build_legacy_layout(doc, data: OutputWord, images: list[SaveImage]):
    match data.mode:
        case 1:
            # for index, image in enumerate(images):
            for i in range(0, data.file_count):
                doc = add_table_two_of_page_horizontal(doc, data.align_vertical, images[i], i + 1)
                _safe_update_progress(i)
        case 2:
            for i in range(0, data.file_count, 2):
                doc = add_table_two_of_page_vertical(doc, data.align_vertical, images[i:i + 2], i + 1)
                _safe_update_progress(i)
        case 4:
            section = doc.sections[-1]
            # 1. 取得原本的寬與高
            current_width = section.page_width
            current_height = section.page_height
            # 2. 設定方向為橫向
            section.orientation = WD_ORIENT.LANDSCAPE
            # 3. 關鍵步驟：手動交換寬與高，否則版面會出錯
            section.page_width = current_height
            section.page_height = current_width
            for i in range(0, data.file_count, 4):
                doc = add_table_four_of_page(doc, data.align_vertical, images[i:i + 4], i + 1)
                _safe_update_progress(i)
        case 6:
            for i in range(0, data.file_count, 3):
                doc = add_table_six_of_page(doc, data.align_vertical, images[i:i + 3], i + 1)
                _safe_update_progress(i)
    return doc


def creat_docx(data: OutputWord):
    """
    一頁兩張的函數
    :param data:
    :return: 創建後的DOC檔
    """
    doc = Document()
    doc = set_font(doc, data.font_size)
    images = data.to_compressed_images()

    if data.layout_mode == 'auto-collage-v1' and data.pages:
        return _render_auto_collage_pages(data, images, doc)

    return _build_legacy_layout(doc, data, images)


def add_header(doc, title_text):
    """
    Word檔加入標頭
    :param doc: DOC檔
    :param title_text: 檔案標題文字
    :return: 編輯後的DOC檔
    """
    header = doc.sections[0].header
    title = header.paragraphs[0].add_run(title_text)
    title.font.size = Pt(20)
    title.font.bold = True
    header.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    log().debug('加入標頭成功')
    return doc


def set_font(doc, size: int):
    """
    用以設定預設字體及大小
    """
    try:
        doc.styles['Normal'].font.name = "Times New Roman"
        doc.styles['Normal'].element.rPr.rFonts.set(qn('w:eastAsia'), u'標楷體')
        doc.styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), u'標楷體')
        doc.styles['Normal'].font.size = Pt(size)
        doc.styles['Normal'].font.color.rgb = RGBColor(0, 0, 0)
        log().debug('設定字體成功')
        return doc
    except Exception as e:
        log().exception(str(e))
        raise AttributeError('找不到指定字體')


def handle_number(no: int) -> str:
    """
    用以處理編號的函數
    :return: 處理完的文字
    """
    return f'編號0{no}' if no < 10 else f'編號{no}'


def add_table_two_of_page_horizontal(doc, align, image: SaveImage, index: int):
    """
    建立一頁2張圖片的表格(水平圖片，上下排佈）
    :param doc: 傳入的doc文件
    :param align: 對齊
    :param image: 傳入的圖片物件
    :param index: 序號，已經轉換成從1開始
    :return: 回傳doc文件
    """
    try:
        # 創建2*2的空表格
        table = doc.add_table(rows=2, cols=2, style='Table Grid')
        # 設定Row的高度
        table.rows[0].height = Cm(9)
        table.rows[1].height = Cm(2.2)
        # 設定Col的寬度
        _set_table_grid_widths(table, [1.8, 15.2])
        for cell in table.columns[0].cells:
            _set_cell_width(cell, 1.8)
        for cell in table.columns[1].cells:
            _set_cell_width(cell, 15.2)

        # 合併表格
        table.cell(0, 0).merge(table.cell(0, 1))

        handle_table_write(
            image=image,
            align=align,
            index=index,
            image_cell=table.cell(0, 0),
            number_cell=table.cell(1, 0),
            remark_cell=table.cell(1, 1),
            max_height=9,
            max_width=15,
        )
        return doc

    except Exception as e:
        log().exception(str(e))


def add_table_two_of_page_vertical(doc, align, images: list[SaveImage], index: int):
    """
    建立一頁2張圖片的表格(垂直圖片，左右排佈）
    :param doc: 傳入的doc文件
    :param align: 對齊方式
    :param images: 傳入的圖片物件清單，最多會傳入兩張圖片
    :param index: 序號，已經轉換成從1開始
    :return: 回傳doc文件
    """
    try:
        # 創建2*2的空表格
        table = doc.add_table(rows=3, cols=2, style='Table Grid')
        # 設定Row的高度
        table.rows[0].height = Cm(18.2)
        table.rows[1].height = Cm(0.8)
        table.rows[2].height = Cm(3.5)
        # 設定Col的寬度
        for cell in table.columns[0].cells:
            cell.width = Cm(7.8)
        for cell in table.columns[1].cells:
            cell.width = Cm(7.8)

        handle_table_write(
            image=images[0],
            align=align,
            index=index,
            image_cell=table.cell(0, 0),
            number_cell=table.cell(1, 0),
            remark_cell=table.cell(2, 0),
            max_height=18,
            max_width=7.6,
        )
        if len(images) >= 2:
            handle_table_write(
                image=images[1],
                align=align,
                index=index + 1,
                image_cell=table.cell(0, 1),
                number_cell=table.cell(1, 1),
                remark_cell=table.cell(2, 1),
                max_height=18,
                max_width=7.6,
            )
        return doc

    except Exception as e:
        log().exception(str(e))


def add_table_six_of_page(doc, align, images: list[SaveImage], index):
    """
    建立一頁6張圖片的表格
    :param doc: 傳入的doc文件
    :param align: 對齊
    :param images: 傳入的圖片物件清單，最多會傳入三張圖片
    :param index: 序號，已經轉換成從1開始
    :return: 回傳doc文件
    """
    try:
        # 創建3*3的空表格
        table = doc.add_table(rows=3, cols=3, style='Table Grid')
        # 設定Row的高度
        table.rows[0].height = Cm(9)
        table.rows[1].height = Cm(0.8)
        table.rows[2].height = Cm(1.4)
        # 設定Col的寬度
        for i in range(0, 2):
            for cell in table.columns[i].cells:
                cell.width = Cm(5.2)

        handle_table_write(
            image=images[0],
            align=align,
            index=index,
            image_cell=table.cell(0, 0),
            number_cell=table.cell(1, 0),
            remark_cell=table.cell(2, 0),
            max_height=9,
            max_width=5,
        )
        if len(images) >= 2:
            handle_table_write(
                image=images[1],
                align=align,
                index=index + 1,
                image_cell=table.cell(0, 1),
                number_cell=table.cell(1, 1),
                remark_cell=table.cell(2, 1),
                max_height=9,
                max_width=5,
            )
        if len(images) >= 3:
            handle_table_write(
                image=images[2],
                align=align,
                index=index + 2,
                image_cell=table.cell(0, 2),
                number_cell=table.cell(1, 2),
                remark_cell=table.cell(2, 2),
                max_height=9,
                max_width=5,
            )

        return doc

    except Exception as e:
        log().exception(str(e))


def add_table_four_of_page(doc, align, images: list[SaveImage], index):
    """
    建立一頁4張圖片的表格
    :param doc: 傳入的doc文件
    :param align: 對齊
    :param images: 傳入的圖片物件清單，最多會傳入四張圖片
    :param index: 序號，已經轉換成從1開始
    :return: 回傳doc文件
    """
    try:
        # 創建4*3的空表格
        table = doc.add_table(rows=3, cols=4, style='Table Grid')
        # 設定Row的高度
        table.rows[0].height = Cm(10)
        table.rows[1].height = Cm(0.6)
        table.rows[2].height = Cm(3.9)
        # 設定Col的寬度
        for i in range(0, 3):
            for cell in table.columns[i].cells:
                cell.width = Cm(6.25)

        handle_table_write(
            image=images[0],
            align=align,
            index=index,
            image_cell=table.cell(0, 0),
            number_cell=table.cell(1, 0),
            remark_cell=table.cell(2, 0),
            max_height=10,
            max_width=6,
        )
        if len(images) >= 2:
            handle_table_write(
                image=images[1],
                align=align,
                index=index + 1,
                image_cell=table.cell(0, 1),
                number_cell=table.cell(1, 1),
                remark_cell=table.cell(2, 1),
                max_height=10,
                max_width=6,
            )
        if len(images) >= 3:
            handle_table_write(
                image=images[2],
                align=align,
                index=index + 2,
                image_cell=table.cell(0, 2),
                number_cell=table.cell(1, 2),
                remark_cell=table.cell(2, 2),
                max_height=10,
                max_width=6,
            )
        if len(images) >= 4:
            handle_table_write(
                image=images[3],
                align=align,
                index=index + 3,
                image_cell=table.cell(0, 3),
                number_cell=table.cell(1, 3),
                remark_cell=table.cell(2, 3),
                max_height=10,
                max_width=6,
            )
        return doc

    except Exception as e:
        log().exception(str(e))


def handle_table_write(image: SaveImage, align, index,
                       image_cell, number_cell, remark_cell,
                       max_height: int | float, max_width: int | float):
    """
    寫入單一表格的資訊
    :param image: 圖片物件
    :param align: 對齊
    :param index: 編號
    :param image_cell: 圖片的表格
    :param number_cell: 編號的表格
    :param remark_cell: 說明的表格
    :param max_height: 表格長上限
    :param max_width: 表格寬上限
    :return:
    """
    try:
        # 寫入文字及對齊
        number_cell.text = handle_number(index)  # 寫入編號
        number_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER  # 表格文字垂直置中
        number_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER  # 文字水平置中
        remark_cell.text = image.remark if image.remark else '無'  # 寫入說明
        if align == 'top':
            remark_cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP  # 表格文字垂直置頂
        elif align == 'center':
            remark_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER  # 表格文字垂直置中

        # 處理圖片寬高
        img = Image.open(image.stream)
        default_aspect_ratio = max_width / max_height  # 預設寬高比
        image_aspect_ratio = img.width / img.height  # 圖片寬高比
        if image_aspect_ratio > default_aspect_ratio:
            # 圖片更扁，設定寬為表格上限
            image_cell.paragraphs[0].add_run().add_picture(image.stream, width=Cm(max_width))
        else:
            # 圖片更長，設定高為表格上限
            image_cell.paragraphs[0].add_run().add_picture(image.stream, height=Cm(max_height))

        # 設定圖片位置'1
        image_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        image_cell.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        log().info(f'編號{index}圖片寫入完成')
    except Exception as e:
        log().error(f'編號{index}圖片寫入失敗，{str(e)}', exc_info=True)
