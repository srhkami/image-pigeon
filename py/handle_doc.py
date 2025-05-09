from docx import Document
from docx.shared import Cm
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from PIL import Image
from handle_image import CustomImage
from handle_log import log


def two_of_page(images):
  """
  一頁兩張的函數
  :param images:
  :return: 創建後的DOC檔
  """
  doc = Document()
  doc = set_font(doc)
  for index, image in enumerate(images):
    img = Image.open(image.stream)
    show_type = 'H'  # 預設設定為高9公分
    if img.width / img.height > 15 / 9:
      # 大於預設寬高比15：9，設定寬為15公分。
      show_type = 'W'
    doc = add_table(doc, image, index + 1, show_type=show_type)
  return doc


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


def set_font(doc):
  """
  用以設定預設字體及大小
  """
  try:
    doc.styles['Normal'].font.name = "Times New Roman"
    doc.styles['Normal'].element.rPr.rFonts.set(qn('w:eastAsia'), u'標楷體')
    doc.styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), u'標楷體')
    doc.styles['Normal'].font.size = Pt(12)
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
  return f'編號\n0{no}' if no < 10 else f'編號\n{no}'


def add_table(doc, image: CustomImage, index, show_type='H', mode=1):
  """
  :param doc: 傳入的doc文件
  :param image: 傳入的圖片物件
  :param index: 序號，已經轉換成從1開始
  :param show_type: 設定高或寬的模式
  :param mode: 如果為2，代表是多張模式
  :return: 回傳doc文件
  """
  try:
    # 創建5*3的空表格
    table = doc.add_table(rows=5, cols=3, style='Table Grid')

    # 設定Col的寬度
    for cell in table.columns[0].cells:
      cell.width = Cm(2)
    for cell in table.columns[1].cells:
      cell.width = Cm(12.5)
    for cell in table.columns[2].cells:
      cell.width = Cm(2.5)

    # 設定Row的高度
    table.rows[0].height = Cm(9)

    # 表格置中對齊
    # table.direction = WD_TABLE_ALIGNMENT.CENTER

    # 合併表格
    table.cell(0, 0).merge(table.cell(0, 2))
    table.cell(1, 0).merge(table.cell(4, 0))
    table.cell(1, 1).merge(table.cell(4, 2))

    # 寫入文字及對齊
    table.cell(1, 0).text = handle_number(index)  # 寫入編號
    table.cell(1, 0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER  # 表格文字垂直置中
    table.cell(1, 0).paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER  # 文字水平置中
    table.cell(1, 1).text = image.remark
    table.cell(1, 1).vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # 寫入圖片
    if mode == 1:
      if show_type == 'H':
        table.cell(0, 0).paragraphs[0].add_run().add_picture(image.stream, height=Cm(9))
      else:
        table.cell(0, 0).paragraphs[0].add_run().add_picture(image.stream, width=Cm(15))
    # if mode == 2:
    #   # 如果mode是2，代表傳入的是清單，需循環取值
    #   for img in img_path:
    #     table.cell(0, 0).paragraphs[0].add_run().add_picture(img, height=Cm(9))
    table.cell(0, 0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    table.cell(0, 0).paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    return doc
  except Exception as e:
    log().exception(str(e))
