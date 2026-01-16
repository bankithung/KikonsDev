import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, FileText, CheckSquare } from 'lucide-react';
import { useFieldArray, Control, UseFormRegister, Controller, useWatch, UseFormSetValue } from 'react-hook-form';

interface DocumentTakeoverProps {
    control: Control<any>;
    register: UseFormRegister<any>;
    setValue: UseFormSetValue<any>; // Needed to clear/set fields
    name?: string; // name of the field array, default 'student_documents'
    checkboxName?: string; // name of the toggle field, default 'documentTakeoverEnabled'
}

const COMMON_DOCUMENTS = [
    "Class 10 Marksheet",
    "Class 10 Passing Certificate",
    "Class 12 Marksheet",
    "Class 12 Passing Certificate",
    "Admit Card (10th/12th)",
    "Migration Certificate",
    "Transfer Certificate (TC)",
    "Character Certificate",
    "Aadhaar Card",
    "PAN Card",
    "Passport",
    "NEET Score Card",
    "Gap Certificate",
    "Domicile Certificate",
    "Caste Certificate",
    "Income Certificate",
    "Passport Size Photos"
];

export function DocumentTakeover({
    control,
    register,
    setValue,
    name = 'student_documents',
    checkboxName = 'documentTakeoverEnabled'
}: DocumentTakeoverProps) {

    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    const isEnabled = useWatch({
        control,
        name: checkboxName,
        defaultValue: false
    });

    React.useEffect(() => {
        if (fields.length > 0 && !isEnabled) {
            setValue(checkboxName, true);
        }
        // Exclude isEnabled to allow manual unchecking if desired
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields.length, setValue, checkboxName]);

    return (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <div className="flex items-center space-x-2">
                <Controller
                    control={control}
                    name={checkboxName}
                    render={({ field }) => (
                        <Checkbox
                            id={checkboxName}
                            checked={field.value}
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked && fields.length === 0) {
                                    append({ name: '', document_number: '', remarks: '' });
                                }
                                if (!checked) {
                                    // Optional: Clear fields if unchecked? No, keep them just in case.
                                }
                            }}
                        />
                    )}
                />
                <Label htmlFor={checkboxName} className="font-medium text-slate-900 cursor-pointer select-none">
                    Document Takeover (Office Holding Originals)
                </Label>
            </div>

            {isEnabled && (
                <div className="space-y-2 pl-6 border-l-2 border-slate-200 mt-2">
                    <p className="text-xs text-slate-500 mb-2">
                        List the physical documents being submitted.
                    </p>

                    {fields.length > 0 && (
                        <div className="hidden md:grid grid-cols-12 gap-3 px-2 mb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            <div className="col-span-4">Document Name</div>
                            <div className="col-span-4">ID / Number</div>
                            <div className="col-span-3">Remarks</div>
                            <div className="col-span-1"></div>
                        </div>
                    )}

                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                            <div className="md:col-span-4">
                                <Label className="md:hidden text-[10px] text-slate-400 mb-1 block">Document Name</Label>
                                <div className="relative">
                                    <Input
                                        list={`doc-options-${index}`}
                                        {...register(`${name}.${index}.name` as const)}
                                        placeholder="Select or Type..."
                                        className="h-8 text-xs"
                                    />
                                    <datalist id={`doc-options-${index}`}>
                                        {COMMON_DOCUMENTS.map(doc => <option key={doc} value={doc} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="md:col-span-4">
                                <Label className="md:hidden text-[10px] text-slate-400 mb-1 block">Document Number / ID</Label>
                                <Input
                                    {...register(`${name}.${index}.document_number` as const)}
                                    placeholder="e.g. A1234567"
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <Label className="md:hidden text-[10px] text-slate-400 mb-1 block">Remarks</Label>
                                <Input
                                    {...register(`${name}.${index}.remarks` as const)}
                                    placeholder="Condition..."
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="md:col-span-1 flex justify-center pt-2 md:pt-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => remove(index)}
                                >
                                    <X size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: '', document_number: '', remarks: '' })}
                        className="mt-2 text-teal-600 border-teal-200 hover:bg-teal-50"
                    >
                        <Plus size={14} className="mr-1" /> Add Document
                    </Button>
                </div>
            )}
        </div>
    );
}
