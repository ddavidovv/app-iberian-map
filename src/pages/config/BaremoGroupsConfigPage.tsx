import { useState, useEffect } from 'react';
import type { BaremoGroup, Baremo, BaremoGroupCreateRequest, BaremoCreateRequest } from '../../types/baremo';
import {
  listBaremoGroups,
  createBaremoGroup,
  updateBaremoGroup,
  deleteBaremoGroup,
  addBaremoToGroup,
  deleteBaremoFromGroup,
} from '../../services/baremoGroupsService';
import { ConfigLayout } from '../../components/layout/ConfigLayout';

export default function BaremoGroupsConfigPage() {
  const [groups, setGroups] = useState<BaremoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroup, setEditingGroup] = useState<BaremoGroup | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState<BaremoGroupCreateRequest>({
    code: '',
    name: '',
    display_order: 999,
    baremos: [],
  });
  const [newBaremoData, setNewBaremoData] = useState<BaremoCreateRequest>({
    code: '',
    name: '',
    display_order: 999,
  });
  const [addingBaremoToGroupId, setAddingBaremoToGroupId] = useState<string | null>(null);

  // Fetch groups on mount and when search changes
  useEffect(() => {
    fetchGroups();
  }, [searchTerm]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listBaremoGroups(searchTerm || undefined, 100, 0);
      setGroups(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.code || !newGroupData.name) {
      setError('Code and name are required');
      return;
    }

    try {
      setError(null);
      await createBaremoGroup(newGroupData);
      setIsCreatingGroup(false);
      setNewGroupData({ code: '', name: '', display_order: 999, baremos: [] });
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      setError(null);
      await updateBaremoGroup(editingGroup.group_id, {
        code: editingGroup.code,
        name: editingGroup.name,
        display_order: editingGroup.display_order,
      });
      setEditingGroup(null);
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      setError(null);
      await deleteBaremoGroup(groupId);
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting group');
    }
  };

  const handleAddBaremo = async (groupId: string) => {
    if (!newBaremoData.code || !newBaremoData.name) {
      setError('Baremo code and name are required');
      return;
    }

    try {
      setError(null);
      await addBaremoToGroup(groupId, newBaremoData);
      setAddingBaremoToGroupId(null);
      setNewBaremoData({ code: '', name: '', display_order: 999 });
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding baremo');
    }
  };

  const handleDeleteBaremo = async (groupId: string, baremoId: string) => {
    if (!confirm('Are you sure you want to delete this baremo?')) return;

    try {
      setError(null);
      await deleteBaremoFromGroup(groupId, baremoId);
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting baremo');
    }
  };

  return (
    <ConfigLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Configuración de Grupos de Baremos
        </h1>

          {/* Search and Create */}
          <div className="mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Nuevo Grupo
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Create Group Form */}
          {isCreatingGroup && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold mb-4">Nuevo Grupo de Baremos</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Código (ej: DEST_PEN)"
                  value={newGroupData.code}
                  onChange={(e) => setNewGroupData({ ...newGroupData, code: e.target.value.toUpperCase() })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Nombre (ej: Destino Peninsular)"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Orden"
                  value={newGroupData.display_order}
                  onChange={(e) => setNewGroupData({ ...newGroupData, display_order: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear
                </button>
                <button
                  onClick={() => {
                    setIsCreatingGroup(false);
                    setNewGroupData({ code: '', name: '', display_order: 999, baremos: [] });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Groups List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando grupos...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron grupos. Crea uno nuevo para comenzar.
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.group_id} className="border border-gray-200 rounded-md p-4">
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      {editingGroup?.group_id === group.group_id ? (
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editingGroup.code}
                            onChange={(e) => setEditingGroup({ ...editingGroup, code: e.target.value.toUpperCase() })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            value={editingGroup.name}
                            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            value={editingGroup.display_order}
                            onChange={(e) => setEditingGroup({ ...editingGroup, display_order: parseInt(e.target.value) })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          <p className="text-sm text-gray-600">
                            Código: {group.code} | Orden: {group.display_order}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingGroup?.group_id === group.group_id ? (
                        <>
                          <button
                            onClick={handleUpdateGroup}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingGroup(group)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.group_id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Baremos List */}
                  <div className="ml-4 mt-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Baremos en este grupo:</h4>
                    {group.baremos.length === 0 ? (
                      <p className="text-sm text-gray-500 mb-2">No hay baremos en este grupo</p>
                    ) : (
                      <div className="space-y-1 mb-2">
                        {group.baremos
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((baremo) => (
                            <div key={baremo.baremo_id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">
                                <strong>{baremo.code}</strong> - {baremo.name} (Orden: {baremo.display_order})
                              </span>
                              <button
                                onClick={() => handleDeleteBaremo(group.group_id, baremo.baremo_id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Add Baremo Form */}
                    {addingBaremoToGroupId === group.group_id ? (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Código"
                            value={newBaremoData.code}
                            onChange={(e) => setNewBaremoData({ ...newBaremoData, code: e.target.value.toUpperCase() })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Nombre"
                            value={newBaremoData.name}
                            onChange={(e) => setNewBaremoData({ ...newBaremoData, name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Orden"
                            value={newBaremoData.display_order}
                            onChange={(e) => setNewBaremoData({ ...newBaremoData, display_order: parseInt(e.target.value) })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddBaremo(group.group_id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Agregar
                          </button>
                          <button
                            onClick={() => {
                              setAddingBaremoToGroupId(null);
                              setNewBaremoData({ code: '', name: '', display_order: 999 });
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingBaremoToGroupId(group.group_id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        + Agregar Baremo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </ConfigLayout>
  );
}
