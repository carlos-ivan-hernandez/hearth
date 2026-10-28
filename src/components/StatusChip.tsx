import {Chip} from '@heroui/react';
import {CircleAlert, CircleCheck, TriangleAlert} from 'lucide-react';
import type {Status} from '../finance';

const LOOK = {
  good: {color: 'success', label: 'Comfortable', Icon: CircleCheck},
  stretch: {color: 'warning', label: 'Stretch', Icon: TriangleAlert},
  risky: {color: 'danger', label: 'Risky', Icon: CircleAlert},
} as const;

/** Status always pairs its color with an icon and a word. */
export const StatusChip = ({status, label}: {status: Status; label?: string}) => {
  const {color, label: fallback, Icon} = LOOK[status];
  return (
    <Chip
      color={color}
      variant='soft'
      size='sm'
      className='w-fit shrink-0'
    >
      <Icon className='size-3.5' />
      <Chip.Label>{label ?? fallback}</Chip.Label>
    </Chip>
  );
};
