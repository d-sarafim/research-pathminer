import os
import glob
import shutil
import pandas as pd

base_destination_dir = 'C:\\Users\\dssar\\OneDrive\\Desktop\\ASTMiner\\Input\\classes\\'
destination_suffix = ['F', 'T']

df = pd.read_csv('./support/classes.csv').reset_index()

for index, row in df.iterrows():
    id = row['ID']
    file = row['FILE']
    project = row['PROJECT']
    start = row['START']
    end = row['END']
    smelly = row['is_god_class']

    destination_path = f'{base_destination_dir}{str(index+1).zfill(3)}_{id}_{destination_suffix[smelly]}'
    file_path = f'{project}\\{file}'

    file_name = file.split("/")[-1]
    destination_file_name = f'{id}_{file_name}'

    destination_file_path = f'{destination_path}\\{destination_file_name}'

    lines = []

    with open(file_path, 'r', encoding='utf8') as f:
        lines = f.readlines()

    if not os.path.exists(destination_path):
        os.makedirs(destination_path)

    with open(destination_file_path, 'w+', encoding='utf8') as f:
        fist_line = lines[start-1]
        pseudo_tab = '  '
        tabs_to_remove = fist_line.count(pseudo_tab)

        for i in range(start-1, end):
            f.write(lines[i].replace(pseudo_tab, '', tabs_to_remove))


