import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { LangProvider } from '../../i18n';
import AddressField from './AddressField';

const searchAddress = vi.fn(async (q: string) => [{ label: `${q} match`, lngLat: [-9.11, 38.63] as [number, number] }]);

vi.mock('../../lib/geocode', () => ({
  searchAddress: (q: string) => searchAddress(q),
  inPilotArea: () => true,
  locate: vi.fn(),
  reverseGeocode: vi.fn(),
}));

function Field({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <LangProvider initial="EN">
      <AddressField value={value} onChange={setValue} onPlace={() => {}} />
    </LangProvider>
  );
}

describe('AddressField', () => {
  it('does not open suggestions for a prefilled address', async () => {
    render(<Field initial="Rua da Cooperativa 14, Amora" />);
    await act(() => new Promise((r) => setTimeout(r, 450)));
    expect(searchAddress).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('searches once the visitor types', async () => {
    const user = userEvent.setup();
    render(<Field initial="" />);
    await user.type(screen.getByRole('combobox'), 'Seixal');
    expect(await screen.findByRole('option', { name: /Seixal match/ })).toBeInTheDocument();
  });
});
