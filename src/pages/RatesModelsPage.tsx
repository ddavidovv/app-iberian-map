import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Save, ArrowLeft, Loader2, Archive, Copy, X, Package, CheckCircle2, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { ratesModelsService } from '../services/ratesModelsService';
import { ProductsSidebar } from '../components/admin/ProductsSidebar';
import { ProductDropZone } from '../components/admin/ProductDropZone';
import type {
  RatesModel,
  RatesModelCreatePayload,
  RatesModelDeleteResponse,
  RatesModelProduct,
  RatesModelStatus,
  RatesModelUpdatePayload
} from '../types/ratesModels';

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

type CreateFormValues = {
  name: string;
  status: RatesModelStatus;
  description?: string;
  notes?: string;
};

const STATUS_LABELS: Record<RatesModelStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado'
};

const DEFAULT_USER = 'admin-ui';

function cloneModel(model: RatesModel): RatesModel {
  return JSON.parse(JSON.stringify(model)) as RatesModel;
}

export function RatesModelsPage() {
  const [models, setModels] = useState<RatesModel[]>([]);
  const [statusFilter, setStatusFilter] = useState<RatesModelStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<RatesModel | null>(null);
  const [editableModel, setEditableModel] = useState<RatesModel | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProductsSidebar, setShowProductsSidebar] = useState(false);
  const [createProducts, setCreateProducts] = useState<RatesModelProduct[]>([]);
  const [createProductCode, setCreateProductCode] = useState('');
  const [createProductName, setCreateProductName] = useState('');
  const [createProductRequired, setCreateProductRequired] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createForm = useForm<CreateFormValues>({
    defaultValues: { name: '', status: 'draft', description: '', notes: '' }
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const loadModels = useCallback(async () => {
    try {
      setLoadingList(true);
      const response = await ratesModelsService.list({
        status: statusFilter,
        search: searchTerm
      });
      setModels(response.items);
      setListError(null);

      if (!response.items.length) {
        setSelectedId(null);
        setSelectedModel(null);
        setEditableModel(null);
      } else if (!selectedId || !response.items.find(model => model.model_id === selectedId)) {
        setSelectedId(response.items[0].model_id);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'No se pudieron cargar los modelos');
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, searchTerm, selectedId]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedId) {
        setSelectedModel(null);
        setEditableModel(null);
        return;
      }
      try {
        setLoadingDetail(true);
        const model = await ratesModelsService.get(selectedId);
        setSelectedModel(model);
        setEditableModel(cloneModel(model));
        setIsDirty(false);
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'No se pudo cargar el modelo seleccionado'
        });
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const availableCount = useMemo(() => {
    if (!editableModel) return 0;
    return editableModel.products.filter(product => product.is_available).length;
  }, [editableModel]);

  const handleFieldChange = (field: keyof RatesModel, value: unknown) => {
    setEditableModel(prev => {
      if (!prev) return prev;
      setIsDirty(true);
      return { ...prev, [field]: value };
    });
  };

  const handleProductChange = (code: string, updates: Partial<RatesModelProduct>) => {
    setEditableModel(prev => {
      if (!prev) return prev;
      const products = prev.products.map(product => {
        if (product.product_code !== code) return product;
        const nextProduct: RatesModelProduct = { ...product, ...updates };
        if (!nextProduct.is_available) nextProduct.is_required = false;
        if (nextProduct.is_required) nextProduct.is_available = true;
        return nextProduct;
      });
      setIsDirty(true);
      return { ...prev, products };
    });
  };

  const removeProduct = (code: string) => {
    setEditableModel(prev => {
      if (!prev) return prev;
      setIsDirty(true);
      return { ...prev, products: prev.products.filter(product => product.product_code !== code) };
    });
  };

  const handleProductDrop = (productName: string, origin: string) => {
    if (!editableModel) return;

    // Generate product code from name
    const code = productName.toUpperCase().replace(/\s+/g, '_');

    // Check if product already exists
    if (editableModel.products.find(product => product.product_code === code)) {
      setFeedback({ type: 'error', message: `El producto "${productName}" ya está en este modelo` });
      return;
    }

    const product: RatesModelProduct = {
      product_code: code,
      product_name: productName,
      is_available: true,
      is_required: false
    };

    setEditableModel(prev => (prev ? { ...prev, products: [...prev.products, product] } : prev));
    setIsDirty(true);
    setFeedback({ type: 'success', message: `Producto "${productName}" añadido correctamente` });
  };

  const handleConfirmProducts = (products: RatesModelProduct[]) => {
    if (!editableModel) return;

    // Filter out products that already exist in the model
    const existingCodes = new Set(editableModel.products.map(p => p.product_code));
    const newProducts = products.filter(p => !existingCodes.has(p.product_code));

    if (newProducts.length === 0) {
      setFeedback({ type: 'error', message: 'Todos los productos seleccionados ya están en el modelo' });
      return;
    }

    setEditableModel(prev => (prev ? { ...prev, products: [...prev.products, ...newProducts] } : prev));
    setIsDirty(true);
    setFeedback({
      type: 'success',
      message: `${newProducts.length} producto${newProducts.length !== 1 ? 's' : ''} añadido${newProducts.length !== 1 ? 's' : ''} correctamente`
    });
    setShowProductsSidebar(false);
  };

  const saveModel = async () => {
    if (!editableModel) return;
    setIsSaving(true);
    try {
      const payload: RatesModelUpdatePayload = {
        name: editableModel.name,
        description: editableModel.description ?? undefined,
        status: editableModel.status,
        notes: editableModel.notes ?? undefined,
        products: editableModel.products,
        updated_by: DEFAULT_USER,
        change_message: 'Actualizacion desde interfaz de modelos'
      };
      const updated = await ratesModelsService.update(editableModel.model_id, payload);
      setSelectedModel(updated);
      setEditableModel(cloneModel(updated));
      setIsDirty(false);
      setFeedback({ type: 'success', message: 'Modelo guardado correctamente' });
      await loadModels();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const archiveModel = async (hard = false) => {
    if (!editableModel) return;
    setIsArchiving(true);
    try {
      const result: RatesModelDeleteResponse = await ratesModelsService.archive(editableModel.model_id, {
        hard,
        updated_by: DEFAULT_USER
      });
      setFeedback({ type: 'success', message: result.message });
      if (hard) {
        setSelectedId(null);
        setSelectedModel(null);
        setEditableModel(null);
      } else if (result.model) {
        setSelectedModel(result.model);
        setEditableModel(cloneModel(result.model));
      }
      await loadModels();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al archivar' });
    } finally {
      setIsArchiving(false);
    }
  };

  const duplicateModel = async () => {
    if (!editableModel) return;
    const newName = window.prompt('Nombre para el nuevo modelo', `${editableModel.name} (copia)`);
    if (!newName) return;
    try {
      const payload: RatesModelCreatePayload = {
        name: newName.trim(),
        description: editableModel.description ?? undefined,
        status: 'draft',
        notes: editableModel.notes ?? undefined,
        products: editableModel.products.map(product => ({ ...product })),
        created_by: DEFAULT_USER,
        initial_activity: `Duplicado desde ${editableModel.name}`
      };
      const created = await ratesModelsService.create(payload);
      setFeedback({ type: 'success', message: 'Modelo duplicado' });
      await loadModels();
      setSelectedId(created.model_id);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al duplicar' });
    }
  };

  const openCreateModal = () => {
    createForm.reset({ name: '', status: 'draft', description: '', notes: '' });
    setCreateProducts([]);
    setCreateProductCode('');
    setCreateProductName('');
    setCreateProductRequired(false);
    setShowCreateModal(true);
  };

  const addCreateProduct = () => {
    const code = createProductCode.trim().toUpperCase();
    if (!code || createProducts.find(product => product.product_code === code)) {
      return;
    }
    setCreateProducts(prev => [
      ...prev,
      {
        product_code: code,
        product_name: createProductName.trim() || undefined,
        is_available: true,
        is_required: createProductRequired
      }
    ]);
    setCreateProductCode('');
    setCreateProductName('');
    setCreateProductRequired(false);
  };

  const removeCreateProduct = (code: string) => {
    setCreateProducts(prev => prev.filter(product => product.product_code !== code));
  };

  const submitCreate = createForm.handleSubmit(async values => {
    if (!createProducts.length) {
      setFeedback({ type: 'error', message: 'Anade al menos un producto' });
      return;
    }
    setIsCreating(true);
    try {
      const payload: RatesModelCreatePayload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        status: values.status,
        notes: values.notes?.trim() || undefined,
        products: createProducts.map(product => ({ ...product })),
        created_by: DEFAULT_USER,
        initial_activity: 'Modelo creado desde el gestor de modelos'
      };
      const created = await ratesModelsService.create(payload);
      setFeedback({ type: 'success', message: 'Modelo creado correctamente' });
      setShowCreateModal(false);
      await loadModels();
      setSelectedId(created.model_id);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al crear' });
    } finally {
      setIsCreating(false);
    }
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-6 px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-red-900" />
              <h1 className="text-2xl font-bold text-gray-900">Modelos Tarifarios</h1>
            </div>
            <p className="text-sm text-gray-600">
              Gestiona los productos permitidos y obligatorios para cada modelo comercial
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo modelo
            </button>
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Panel de admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {feedback && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border-2 px-5 py-3.5 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800'
                : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[32%_1fr]">
          <aside className="space-y-5">
            <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-lg transition-shadow duration-200 hover:shadow-xl">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                <FileText className="h-4 w-4 text-red-600" />
                Buscar
              </label>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre o nota"
                className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
              <label className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as RatesModelStatus | 'all')}
                className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              >
                <option value="all">Todos</option>
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div className="rounded-xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
              {loadingList ? (
                <div className="flex items-center justify-center py-16 text-sm font-medium text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-red-600" />
                  Cargando modelos...
                </div>
              ) : listError ? (
                <div className="space-y-3 p-6 text-sm">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{listError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadModels}
                    className="text-xs font-semibold text-red-800 underline transition-colors hover:text-red-600"
                  >
                    Reintentar
                  </button>
                </div>
              ) : !models.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No hay modelos configurados</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {models.map(model => {
                    const statusColors = {
                      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      draft: 'bg-amber-100 text-amber-700 border-amber-200',
                      archived: 'bg-gray-100 text-gray-600 border-gray-200'
                    };
                    return (
                      <li
                        key={model.model_id}
                        onClick={() => setSelectedId(model.model_id)}
                        className={`cursor-pointer px-5 py-4 transition-all duration-200 ${
                          selectedId === model.model_id
                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-600'
                            : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-800">{model.name}</span>
                          <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusColors[model.status]}`}>
                            {STATUS_LABELS[model.status]}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Package className="h-3.5 w-3.5" />
                          <span className="font-medium">{model.products.length} productos</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section className="rounded-xl border-2 border-gray-200 bg-white p-8 shadow-xl">
            {!selectedId ? (
              <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-base font-medium text-gray-500">Selecciona un modelo para comenzar</p>
                <p className="text-sm text-gray-400 mt-1">Elige un modelo de la lista lateral para ver sus detalles</p>
              </div>
            ) : loadingDetail || !editableModel ? (
              <div className="flex h-full items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  <p className="text-sm font-medium text-gray-500">Cargando detalle...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Información básica */}
                <div className="rounded-xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                    <FileText className="h-4 w-4 text-red-600" />
                    Información Básica
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Nombre del Modelo
                      </label>
                      <input
                        type="text"
                        value={editableModel.name}
                        onChange={(event) => handleFieldChange('name', event.target.value)}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Estado
                      </label>
                      <select
                        value={editableModel.status}
                        onChange={(event) => handleFieldChange('status', event.target.value as RatesModelStatus)}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      >
                        <option value="draft">Borrador</option>
                        <option value="active">Activo</option>
                        <option value="archived">Archivado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Descripciones y notas */}
                <div className="rounded-xl border-2 border-gray-100 bg-gradient-to-br from-blue-50/50 to-white p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Descripciones
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={editableModel.description ?? ''}
                        onChange={(event) => handleFieldChange('description', event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                        Notas Internas
                      </label>
                      <textarea
                        value={editableModel.notes ?? ''}
                        onChange={(event) => handleFieldChange('notes', event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800">
                        <Package className="h-3.5 w-3.5" />
                        Productos disponibles: {availableCount} / {editableModel.products.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="rounded-xl border-2 border-gray-100 bg-gradient-to-br from-purple-50/50 to-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                      <Package className="h-5 w-5 text-purple-600" />
                      Gestión de Productos
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProductsSidebar(true)}
                        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-purple-700 hover:shadow-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir desde Maestro
                      </button>
                      <button
                        type="button"
                        onClick={duplicateModel}
                        className="flex items-center gap-2 rounded-lg border-2 border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-700 transition-all duration-200 hover:scale-105 hover:border-purple-300 hover:bg-purple-50 hover:shadow-lg"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicar modelo
                      </button>
                    </div>
                  </div>

                  <ProductDropZone onDrop={handleProductDrop} isEmpty={editableModel.products.length === 0}>
                    {editableModel.products.length > 0 && (
                      <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-md">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-xs font-bold uppercase tracking-wide text-gray-700">
                        <tr>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-center">Disponible</th>
                          <th className="px-4 py-3 text-center">Obligatorio</th>
                          <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {editableModel.products.map(product => (
                          <tr key={product.product_code} className="transition-colors duration-150 hover:bg-purple-50/30">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                                  {product.product_code}
                                </div>
                                {product.is_required && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={product.product_name ?? ''}
                                onChange={(event) =>
                                  handleProductChange(product.product_code, { product_name: event.target.value })
                                }
                                placeholder="Nombre visible del producto"
                                className="mt-2 w-full rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs transition-all duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={product.is_available}
                                onChange={(event) =>
                                  handleProductChange(product.product_code, { is_available: event.target.checked })
                                }
                                className="h-5 w-5 rounded border-2 border-gray-300 text-emerald-600 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={product.is_required}
                                onChange={(event) =>
                                  handleProductChange(product.product_code, { is_required: event.target.checked })
                                }
                                className="h-5 w-5 rounded border-2 border-gray-300 text-red-600 transition-all duration-200 focus:ring-2 focus:ring-red-500/20 focus:ring-offset-0"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeProduct(product.product_code)}
                                className="group rounded-lg border-2 border-transparent p-2 text-gray-400 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title="Eliminar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    )}
                  </ProductDropZone>

                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setEditableModel(selectedModel ? cloneModel(selectedModel) : null)}
                    disabled={!isDirty}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-105 hover:border-gray-400 hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Deshacer
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveModel(false)}
                    className="flex items-center gap-2 rounded-lg border-2 border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 transition-all duration-200 hover:scale-105 hover:border-amber-400 hover:bg-amber-50 hover:shadow-lg disabled:opacity-40"
                    disabled={isArchiving}
                  >
                    <Archive className="h-4 w-4" />
                    {isArchiving ? 'Archivando...' : 'Archivar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveModel(true)}
                    className="flex items-center gap-2 rounded-lg border-2 border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:scale-105 hover:border-red-400 hover:bg-red-50 hover:shadow-lg disabled:opacity-40"
                    disabled={isArchiving}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={saveModel}
                    className="group ml-auto flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-2.5 text-sm font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-red-700 hover:to-red-800 hover:shadow-2xl disabled:opacity-40 disabled:hover:scale-100"
                    disabled={!isDirty || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl border-2 border-gray-300 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-600 p-2.5">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-800">Crear Nuevo Modelo Tarifario</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="space-y-6 px-6 py-6">
              <div className="rounded-xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                  <FileText className="h-4 w-4 text-red-600" />
                  Información del Modelo
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                      Nombre
                    </label>
                    <input
                      type="text"
                      {...createForm.register('name', { required: true, minLength: 3 })}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      placeholder="Ej: Peninsular B2B"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                      Estado inicial
                    </label>
                    <select
                      {...createForm.register('status')}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    >
                      <option value="draft">Borrador</option>
                      <option value="active">Activo</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>
                </div>
                <div className="mt-5">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    {...createForm.register('description')}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    placeholder="Describe el propósito de este modelo tarifario..."
                  />
                </div>
                <div className="mt-5">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                    Notas internas
                  </label>
                  <textarea
                    rows={3}
                    {...createForm.register('notes')}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    placeholder="Notas privadas para uso interno..."
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-purple-700">
                  <Package className="h-4 w-4" />
                  Productos del Modelo ({createProducts.length})
                </h3>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="text"
                    value={createProductCode}
                    onChange={(event) => setCreateProductCode(event.target.value)}
                    placeholder="Código del producto"
                    className="rounded-lg border-2 border-purple-200 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                  />
                  <input
                    type="text"
                    value={createProductName}
                    onChange={(event) => setCreateProductName(event.target.value)}
                    placeholder="Nombre del producto"
                    className="rounded-lg border-2 border-purple-200 px-4 py-2.5 text-sm transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg bg-white border-2 border-purple-200 px-3 py-2 text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={createProductRequired}
                        onChange={(event) => setCreateProductRequired(event.target.checked)}
                        className="h-4 w-4 rounded border-2 text-purple-600"
                      />
                      Obligatorio
                    </label>
                    <button
                      type="button"
                      onClick={addCreateProduct}
                      className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-purple-800 hover:shadow-xl"
                    >
                      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      Añadir
                    </button>
                  </div>
                </div>
                {createProducts.length > 0 && (
                  <ul className="mt-4 divide-y divide-gray-200 rounded-xl border-2 border-gray-200 bg-white shadow-md text-sm">
                    {createProducts.map(product => (
                      <li key={product.product_code} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-purple-50/30">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {product.product_code}
                          </div>
                          <div>
                            {product.product_name && (
                              <p className="text-sm font-medium text-gray-800">{product.product_name}</p>
                            )}
                            {product.is_required && (
                              <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Obligatorio
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCreateProduct(product.product_code)}
                          className="rounded-lg border-2 border-transparent p-2 text-gray-400 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-4 border-t-2 border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-105 hover:border-gray-400 hover:shadow-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-2.5 text-sm font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-red-700 hover:to-red-800 hover:shadow-2xl disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Crear modelo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Sidebar */}
      <ProductsSidebar
        isOpen={showProductsSidebar}
        onClose={() => setShowProductsSidebar(false)}
        onConfirm={handleConfirmProducts}
      />
    </div>
    </DndProvider>
  );
}
