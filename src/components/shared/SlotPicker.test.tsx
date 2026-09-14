import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import SlotPicker from './SlotPicker';
import { LangProvider } from '../../i18n';

// Monday 14 September 2026, 09:00 — only Date is faked, timers stay real.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 14, 9, 0));
});
afterEach(() => vi.useRealTimers());

function Harness({ day = 1, win = 2, spy }: { day?: number; win?: number; spy: (d: number, w: number) => void }) {
  const [slot, setSlot] = useState({ day, win });
  return (
    <SlotPicker
      variant="compact"
      labels={['Day', 'Window']}
      day={slot.day}
      win={slot.win}
      onChange={(d, w) => {
        spy(d, w);
        setSlot({ day: d, win: w });
      }}
    />
  );
}

const renderPicker = (props: { day?: number; win?: number } = {}) => {
  const spy = vi.fn();
  render(
    <LangProvider>
      <Harness {...props} spy={spy} />
    </LangProvider>,
  );
  return spy;
};

describe('SlotPicker', () => {
  it('picks a day from the month calendar, and shows it on the field', async () => {
    const user = userEvent.setup();
    const spy = renderPicker();
    expect(screen.getByRole('button', { name: 'Day Tomorrow' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Day Tomorrow' }));
    const dialog = screen.getByRole('dialog', { name: 'Day' });
    expect(dialog).toHaveTextContent('September 2026');
    // The selected day takes focus; yesterday can't be booked.
    expect(screen.getByRole('button', { name: 'Tuesday 15 September' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Sunday 13 September' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Friday 25 September' }));
    expect(spy).toHaveBeenLastCalledWith(11, 2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Day Fri 25/ })).toHaveFocus();
  });

  it('moves by day and week with the arrow keys, and Escape hands focus back', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole('button', { name: 'Day Tomorrow' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Wednesday 16 September' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Wednesday 23 September' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Day Tomorrow' })).toHaveFocus();
  });

  it('reaches 30 days ahead and no further', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole('button', { name: 'Day Tomorrow' }));
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('October 2026');
    expect(screen.getByRole('button', { name: 'Tuesday 13 October' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Wednesday 14 October' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it("disables today's windows that have passed, and keeps a still-open choice", async () => {
    const user = userEvent.setup();
    const spy = renderPicker({ day: 0, win: 2 });
    await user.click(screen.getByRole('button', { name: 'Window 12–14' }));
    expect(screen.getByRole('button', { name: '08–10' })).toBeDisabled();
    expect(screen.getByText("Windows today need an hour's notice.")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '10–12' }));
    expect(spy).toHaveBeenLastCalledWith(0, 1);
  });
});
