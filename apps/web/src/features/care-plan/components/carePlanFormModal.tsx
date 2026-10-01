import { useCreateCarePlan, useUpdateCarePlan } from '@/features/care-plan/hooks';
import type { CarePlan } from '@/features/care-plan/types';
import { Modal } from '@/shared/components/modal';

import { CarePlanForm } from './carePlanForm';

type CreateModeProps = {
  mode: 'create';
  open: boolean;
  onClose: () => void;
};

type EditModeProps = {
  mode: 'edit';
  open: boolean;
  plan: CarePlan;
  onClose: () => void;
};

type CarePlanFormModalProps = CreateModeProps | EditModeProps;

export const CarePlanFormModal = (props: CarePlanFormModalProps) => {
  const create = useCreateCarePlan();
  const update = useUpdateCarePlan();

  if (props.mode === 'create') {
    return (
      <Modal open={props.open} onClose={props.onClose} title="New care plan" size="md">
        <CarePlanForm
          mode="create"
          isSaving={create.isPending}
          onCancel={props.onClose}
          onSubmit={(values) => {
            create.mutate(values, {
              onSuccess: () => props.onClose(),
            });
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Edit care plan" size="md">
      <CarePlanForm
        mode="edit"
        plan={props.plan}
        isSaving={update.isPending}
        onCancel={props.onClose}
        onSubmit={(values) => {
          update.mutate(
            { id: props.plan.id, input: values },
            {
              onSuccess: () => props.onClose(),
            },
          );
        }}
      />
    </Modal>
  );
};
