# -*- coding: utf-8 -*-
import sys
import docx

sys.stdout.reconfigure(encoding='utf-8')

def inspect_table_props():
    itc = docx.Document('docs/Doc_ITC.docx')
    t0 = itc.tables[0]
    print("Doc_ITC Table 0 XML summary:")
    tblPr = t0._tbl.tblPr
    print("tblPr XML:", tblPr.xml if tblPr is not None else "None")
    
    srs = docx.Document('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx')
    t20 = srs.tables[20]
    print("\nSRS V2.2 Table 20 XML summary:")
    tblPr20 = t20._tbl.tblPr
    print("tblPr XML:", tblPr20.xml if tblPr20 is not None else "None")

if __name__ == '__main__':
    inspect_table_props()
