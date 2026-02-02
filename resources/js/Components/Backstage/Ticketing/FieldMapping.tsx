import { Label } from '@/Components/Shared/ui/label';
import * as React from 'react';

interface FieldMappingProps {
    fields: string[];
    firstNameField: string;
    setFirstNameField: (value: string) => void;
    lastNameField: string;
    setLastNameField: (value: string) => void;
    emailField: string;
    setEmailField: (value: string) => void;
    mailMode: 'normal' | 'qr';
    setMailMode: (value: 'normal' | 'qr') => void;
    nullableFields: Record<string, boolean>;
    setNullableFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function FieldMapping({
    fields,
    firstNameField,
    setFirstNameField,
    lastNameField,
    setLastNameField,
    emailField,
    setEmailField,
    mailMode,
    setMailMode,
    nullableFields,
    setNullableFields,
}: FieldMappingProps) {
    return (
        <aside className="">
            <div>
                <h4 className="text-sm font-semibold">
                    Field Mapping
                </h4>
                <div className="mt-2 space-y-2">
                    <div>
                        <Label>First name source</Label>
                        <select
                            value={firstNameField}
                            onChange={(e) =>
                                setFirstNameField(e.target.value)
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">
                                — No mapping available —
                            </option>
                            {fields.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Last name source</Label>
                        <select
                            value={lastNameField}
                            onChange={(e) =>
                                setLastNameField(e.target.value)
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">
                                — No mapping available —
                            </option>
                            {fields.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Email source</Label>
                        <select
                            value={emailField}
                            onChange={(e) =>
                                setEmailField(e.target.value)
                            }
                            className="w-full rounded-md border p-2"
                        >
                            <option value="">
                                — No mapping available —
                            </option>
                            {fields.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mail information section: choose normal | qr embedding. If QR selected show event name/date inputs and per-column nullable radios */}
                <div className="mt-10">
                    <h4 className="text-sm font-semibold">
                        Mail information
                    </h4>
                    <div className="mt-2 space-y-3">
                        <div>
                            <Label>Mail type</Label>
                            <div className="mt-1 flex gap-4">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="mailMode"
                                        value="normal"
                                        checked={
                                            mailMode === 'normal'
                                        }
                                        onChange={() =>
                                            setMailMode('normal')
                                        }
                                    />
                                    <span className="ml-1">
                                        Normal mail
                                    </span>
                                </label>

                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="mailMode"
                                        value="qr"
                                        checked={mailMode === 'qr'}
                                        onChange={() =>
                                            setMailMode('qr')
                                        }
                                    />
                                    <span className="ml-1">
                                        Mail with QR embedding
                                    </span>
                                </label>
                            </div>
                        </div>
                        {/* When Mail with QR embedding is selected we take event metadata from the chosen event.
                            Use the {{qr}} placeholder anywhere in your message to place the QR image. */}
                        {mailMode === 'qr' && (
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div>
                                    Event name and date will be
                                    taken directly from the selected
                                    event. No need to enter them
                                    here.
                                </div>
                                <div>
                                    Use <code>{'{{qr}}'}</code> in
                                    your message where you want the
                                    QR image to appear.
                                </div>
                            </div>
                        )}

                        {/* Column nullable controls — visible regardless of mail mode */}
                        <div>
                            <Label>
                                Skippable columns: can undefined
                                user values be gracefully skipped?
                            </Label>
                            <div className="mt-2 space-y-2 text-sm">
                                {fields.map((f) => (
                                    <div
                                        key={f}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-36 text-xs text-muted-foreground">{`{{${f}}}`}</div>
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`nullable-${f}`}
                                                checked={
                                                    !nullableFields[
                                                        f
                                                    ]
                                                }
                                                onChange={() =>
                                                    setNullableFields(
                                                        (prev) => ({
                                                            ...prev,
                                                            [f]: false,
                                                        }),
                                                    )
                                                }
                                            />
                                            <span className="ml-1">
                                                Required [appear as
                                                "undefined"]
                                            </span>
                                        </label>

                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`nullable-${f}`}
                                                checked={Boolean(
                                                    nullableFields[
                                                        f
                                                    ],
                                                )}
                                                onChange={() =>
                                                    setNullableFields(
                                                        (prev) => ({
                                                            ...prev,
                                                            [f]: true,
                                                        }),
                                                    )
                                                }
                                            />
                                            <span className="ml-1">
                                                Skippable
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
