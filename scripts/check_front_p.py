# -*- coding: utf-8 -*-
import sys, docx
sys.stdout.reconfigure(encoding='utf-8')

srs = docx.Document('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx')
for i in range(25):
    txt = srs.paragraphs[i].text.strip().replace('\n', ' ')
    print(f"{i:02d} [{srs.paragraphs[i].style.name}]: \"{txt[:60]}\"")
