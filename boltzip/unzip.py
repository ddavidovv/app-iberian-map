import zipfile
import os
import glob

# Obtener el directorio actual y el directorio anterior
current_dir = os.getcwd()
parent_dir = os.path.dirname(current_dir)

# Buscar todos los archivos .zip en el directorio actual
zip_files = glob.glob(os.path.join(current_dir, "*.zip"))

if not zip_files:
    print("No se encontraron archivos .zip en el directorio actual.")
else:
    # Seleccionar el archivo .zip más reciente
    latest_zip = max(zip_files, key=os.path.getmtime)
    print(f"Archivo .zip más reciente: {latest_zip}")

    # Extraer el contenido de la carpeta 'project' en el directorio padre
    with zipfile.ZipFile(latest_zip, 'r') as zip_ref:
        for file in zip_ref.namelist():
            if file.startswith("project/") and not file.endswith("/"):  # Filtrar archivos en la carpeta 'project'
                # Calcular la ruta de destino en el directorio padre
                relative_path = os.path.relpath(file, "project/")  # Ruta relativa eliminando "project/"
                destination_path = os.path.join(parent_dir, relative_path)

                # Crear los directorios necesarios si no existen
                os.makedirs(os.path.dirname(destination_path), exist_ok=True)

                # Extraer el archivo
                with open(destination_path, "wb") as f:
                    f.write(zip_ref.read(file))

    print(f"Contenido de 'project/' extraído a: {parent_dir}")
