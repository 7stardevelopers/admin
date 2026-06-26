import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVectr } from '@/context/VectrContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/PageTransition';
import { FloatingLabel } from '@/components/effects/FloatingLabel';
import { servicesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Service, Category } from '@/types';
import { Plus, Pencil, X, Clock } from 'lucide-react';

// ── Modal Shell ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="glass-card"
        style={{
          padding: '28px', width: '100%', maxWidth: '480px',
          maxHeight: '90vh', overflowY: 'auto',
          background: 'rgba(12,16,24,0.92)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{title}</h2>
          <motion.button
            onClick={onClose}
            whileHover={{ rotate: 90, color: 'var(--amber)' }}
            whileTap={{ scale: 0.85 }}
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalButtons({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
      <Button type="button" variant="glass" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
        Cancel
      </Button>
      <Button type="submit" variant="amber" loading={loading} style={{ flex: 1, justifyContent: 'center' }}>
        {loading ? 'Saving…' : label}
      </Button>
    </div>
  );
}

// ── Service Form ──────────────────────────────────────────────────────────
type ServiceForm = { name: string; categoryId: string; basePrice: number; duration: number; description?: string; image?: string };

function ServiceFormFields({ register, errors, categories, defaults }: { register: any; errors: any; categories: Category[]; defaults?: Partial<ServiceForm> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <FloatingLabel
        label="Service Name *"
        defaultValue={defaults?.name}
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />
      <FloatingLabel
        as="select"
        label="Category *"
        defaultValue={defaults?.categoryId}
        error={errors.categoryId?.message}
        {...register('categoryId', { required: 'Category is required' })}
      >
        <option value="">Select a category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </FloatingLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FloatingLabel
          type="number"
          label="Base Price (₹) *"
          defaultValue={defaults?.basePrice}
          {...register('basePrice', { required: true, min: 1 })}
        />
        <FloatingLabel
          type="number"
          label="Duration (mins) *"
          defaultValue={defaults?.duration}
          {...register('duration', { required: true, min: 15 })}
        />
      </div>
      <FloatingLabel
        as="textarea"
        rows={2}
        label="Description"
        defaultValue={defaults?.description}
        {...register('description')}
      />
      <FloatingLabel
        label="Image URL"
        hint="Direct image link (.jpg / .png / .webp)"
        defaultValue={defaults?.image}
        {...register('image')}
      />
    </div>
  );
}

function AddServiceModal({ categories, onClose, onSuccess }: { categories: Category[]; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ServiceForm>();
  const [serverError, setServerError] = useState('');
  const mutation = useMutation({
    mutationFn: (d: ServiceForm) => servicesApi.createService({ ...d, basePrice: Number(d.basePrice), duration: Number(d.duration) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create'),
  });
  return (
    <Modal title="Add New Service" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <ServiceFormFields register={register} errors={errors} categories={categories} />
        {serverError && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Create Service" />
      </form>
    </Modal>
  );
}

function EditServiceModal({ service, categories, onClose, onSuccess }: { service: Service; categories: Category[]; onClose: () => void; onSuccess: () => void }) {
  const defaults = {
    name: service.name,
    categoryId: service.category?.id ?? '',
    basePrice: service.basePrice,
    duration: service.duration,
    description: service.description ?? '',
    image: service.image ?? '',
  };
  const { register, handleSubmit, formState: { errors } } = useForm<ServiceForm>({ defaultValues: defaults });
  const [serverError, setServerError] = useState('');
  const mutation = useMutation({
    mutationFn: (d: ServiceForm) => servicesApi.updateService(service.id, { ...d, basePrice: Number(d.basePrice), duration: Number(d.duration) }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to update'),
  });
  return (
    <Modal title="Edit Service" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <ServiceFormFields register={register} errors={errors} categories={categories} defaults={defaults} />
        {serverError && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Save Changes" />
      </form>
    </Modal>
  );
}

type CategoryForm = { name: string; description?: string; icon?: string; sortOrder?: number };

function AddCategoryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryForm>();
  const [serverError, setServerError] = useState('');
  const mutation = useMutation({
    mutationFn: (d: CategoryForm) => servicesApi.createCategory({ ...d, sortOrder: d.sortOrder ? Number(d.sortOrder) : 0 }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => setServerError(e.response?.data?.message ?? 'Failed to create'),
  });
  return (
    <Modal title="Add New Category" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FloatingLabel label="Category Name *" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <FloatingLabel label="Icon URL" {...register('icon')} />
          <FloatingLabel label="Description" {...register('description')} />
          <FloatingLabel type="number" label="Sort Order" {...register('sortOrder')} />
        </div>
        {serverError && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Create Category" />
      </form>
    </Modal>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Services() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);
  const [activeTab, setActiveTab]   = useState<'services' | 'categories'>('services');
  const [showAdd, setShowAdd]       = useState(false);
  const [editService, setEdit]      = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => { const res = await servicesApi.getAll({ limit: 100, showAll: true }); return res.data.data; },
  });

  const { data: catsData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await servicesApi.getCategories({ showAll: true }); return res.data.data; },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => servicesApi.updateService(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-admin'] }),
  });

  const services: Service[]   = servicesData?.services ?? servicesData ?? [];
  const cats: Category[]      = catsData?.categories ?? catsData ?? [];

  const serviceColumns = [
    {
      key: 'name', header: 'Service',
      render: (r: Service) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {r.image
            ? (
              <motion.img
                src={r.image}
                alt=""
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )
            : <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--glass-bg)', border: 'var(--glass-border)', flexShrink: 0 }} />
          }
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{r.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.category?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'basePrice', header: 'Base Price',
      render: (r: Service) => <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{formatCurrency(r.basePrice)}</span>,
    },
    {
      key: 'duration', header: 'Duration',
      render: (r: Service) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
          <Clock size={12} /> {r.duration} min
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: Service) => <Badge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions', header: '',
      render: (r: Service) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <motion.button
            onClick={() => setEdit(r)}
            whileHover={{ scale: 1.15, color: 'var(--amber)' }}
            whileTap={{ scale: 0.9 }}
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Pencil size={14} />
          </motion.button>
          <motion.button
            onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              color: r.isActive ? '#f87171' : '#34d399',
              background: r.isActive ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
            }}
          >
            {r.isActive ? 'Suspend' : 'Activate'}
          </motion.button>
        </div>
      ),
    },
  ];

  const catColumns = [
    {
      key: 'name', header: 'Category',
      render: (r: Category) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {r.icon && <img src={r.icon} alt="" style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    {
      key: 'services', header: 'Services',
      render: (r: Category) => <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{r._count?.services ?? 0} services</span>,
    },
    { key: 'status', header: 'Status', render: (r: Category) => <Badge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'order', header: 'Sort Order',
      render: (r: Category) => <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{r.sortOrder}</span>,
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Services" subtitle="Manage categories and service listings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          {/* Animated tab switcher with shared layout underline */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '14px', padding: '4px', position: 'relative' }}>
            {(['services', 'categories'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <motion.button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setShowAdd(false); }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    position: 'relative',
                    padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', textTransform: 'capitalize',
                    background: 'transparent',
                    color: active ? '#07090e' : 'var(--muted)',
                    zIndex: 1,
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="serviceTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg,#ffb238,#ff8a1e)',
                        borderRadius: '10px',
                        zIndex: -1,
                        boxShadow: '0 4px 12px rgba(255,138,30,0.3)',
                      }}
                    />
                  )}
                  {tab}
                </motion.button>
              );
            })}
          </div>
          <Button variant="amber" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add {activeTab === 'services' ? 'Service' : 'Category'}
          </Button>
        </div>

        {activeTab === 'services'
          ? <DataTable columns={serviceColumns} data={services} isLoading={loadingServices} emptyText="No services found" />
          : <DataTable columns={catColumns} data={cats} isLoading={loadingCats} emptyText="No categories found" />
        }

        <AnimatePresence>
          {showAdd && activeTab === 'services' && (
            <AddServiceModal categories={cats} onClose={() => setShowAdd(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['services-admin'] })} />
          )}
          {showAdd && activeTab === 'categories' && (
            <AddCategoryModal onClose={() => setShowAdd(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['categories'] })} />
          )}
          {editService && (
            <EditServiceModal service={editService} categories={cats}
              onClose={() => setEdit(null)}
              onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['services-admin'] }); setEdit(null); }} />
          )}
        </AnimatePresence>
      </DashboardLayout>
    </PageTransition>
  );
}
