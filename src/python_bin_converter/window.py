#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import webbrowser
from json import JSONEncoder, load
from struct import unpack
import sys
import os
import pandas as pd
import numpy as np
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QFileDialog, QLabel, QVBoxLayout
from PyQt5.QtCore import QFileInfo, Qt
from PyQt5.QtGui import QIcon, QPixmap

class Window(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()
    def initUI(self):
        self.setWindowTitle('ATOM READER')
        self.setWindowIcon(QIcon('atom.png'))    
        self.setFixedWidth(300)
        self.setFixedHeight(180)
        self.layout = QVBoxLayout(self)
        self.btn = QPushButton('&load file', self)
        self.layout.addWidget(self.btn)
        self.btn.clicked.connect(self.open_file)
        self.btn_2 = QPushButton('view atom data on the yandex',self)
        self.load = False
        self.layout.addWidget(self.btn_2)
        self.btn_2.setEnabled(self.load) 
        self.btn_2.clicked.connect(self.open_map)
        self.list_js_obj = []
    
    def open_file(self)->str:
        try:
            global dir
            file = pd.DataFrame(columns={'TimeUS':[1],'NormMD':[2],"NormMDe":[3],"MD04":[4],"MD04e":[5],"MD11":[6],"MD11e":[7]})
            file.to_csv("/home/yahor/a1/ATOM.csv",mode='w',index=False)
            file = QFileDialog.getOpenFileName(None, 'Open file', '~', "bin(*.bin)")
            dir = QFileInfo(file[0]).canonicalPath()
            self.load = self.read_file(file[0])
            self.write_to_json()
            return dir
        except:
            e = sys.exc_info()[0]
            print( "Error: %s" % str(e))
            print("could not open")
            #sys.exit(app.exec_())

    def read_file(self,_fd)->bool:
        data = np.fromfile(_fd,  dtype='B')
        buffer = bytearray()
        for byte in data:
            buffer.append(byte)
            if (len(buffer) > 3 and(byte.tobytes() == b'\xa3')):
                if (b"\xa3\x95\x18" in buffer):
                    buffer.pop()
                    self.write_to_csv(buffer[3:])
                buffer.clear()
                buffer.append(byte)
        print("Reading complite")
        self.btn_2.setEnabled(True)
        return True
        
    def write_to_csv(self,_buf: bytearray):
        if len(_buf)<32:
            return
        raw = unpack('dffffff',_buf)
        mat = np.array(raw)
        self.df = pd.DataFrame([mat],columns={'TimeUS','NormMD',"NormMDe","MD04","MD04e","MD11","MD11e"})
        self.df.to_csv(dir + '/atom.csv',header=False,mode='a',index=False)
        self.list_js_obj.append(self.df.to_json(orient='records',lines=True))

    def open_map(self):
        webbrowser.open_new(os.path.dirname(os.path.abspath(__file__))+'/map.html')

    def write_to_json(self):
         with open(os.path.dirname(os.path.abspath(__file__)) + '/atom.json' ,'w') as json_file:
            print(self.list_js_obj)
            json.dump(self.list_js_obj,json_file,indent=4,separators=(',',': '))

    def icon():
        icon = QIcon()
        icon.addPixmap(QPixmap("atom.png"),QIcon.Selected, QIcon.On)
        return icon

if __name__ == '__main__':
    app = QApplication(sys.argv)
    w = Window()
    w.show()
    sys.exit(app.exec_())
