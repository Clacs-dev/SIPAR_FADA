import React, { useState } from 'react';
import { ActasList } from './actas-list';
import { ActaForm } from './acta-form';
import { ActaDetails } from './acta-details';
import type { Acta } from '../../types/acta';

type View = 'list' | 'create' | 'edit' | 'details';

export function ActasModule() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

  const handleSelectActa = (acta: Acta) => {
    setSelectedActa(acta);
    setCurrentView('details');
  };

  const handleCreateNew = () => {
    setSelectedActa(null);
    setCurrentView('create');
  };

  const handleEdit = (acta: Acta) => {
    setSelectedActa(acta);
    setCurrentView('edit');
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setSelectedActa(null);
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedActa(null);
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedActa(null);
  };

  const handleNavigateToDemo = () => {
    // Abrir demo em nova aba ou navegar na mesma
    window.open('#acta-demo', '_blank');
  };

  return (
    <div className="p-6">
      {currentView === 'list' && (
        <ActasList
          onSelectActa={handleSelectActa}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onNavigateToDemo={handleNavigateToDemo}
        />
      )}

      {currentView === 'create' && (
        <ActaForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {currentView === 'edit' && selectedActa && (
        <ActaForm
          acta={selectedActa}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {currentView === 'details' && selectedActa && (
        <ActaDetails
          acta={selectedActa}
          onEdit={() => handleEdit(selectedActa)}
          onBack={handleBack}
        />
      )}
    </div>
  );
}