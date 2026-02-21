import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWatchBalance } from "@scaffold-ui/hooks";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import * as z from "zod";
import EtherInput from "~~/components/EtherInput";
import { Button } from "~~/components/ui/button";
import { Calendar } from "~~/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~~/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "~~/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "~~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { Spinner } from "~~/components/ui/spinner";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const formSchema = z
  .object({
    title: z.string().min(5, { error: "Market title is required." }),
    category: z.string(),
    endDate: z.date(), ///.refine(date => date >= new Date(), "Invalid end date Selected."),
    description: z.string().min(5, { error: "Resolution criteria is required." }),
    volume: z.coerce.number<number>({ error: "Please enter a valid amount" }),
    availableBalance: z.number(),
  })
  .check(ctx => {
    if (ctx.value.volume > ctx.value.availableBalance || ctx.value.volume == ctx.value.availableBalance) {
      ctx.issues.push({
        code: "custom",
        message: "Insufficient Eth Balance",
        input: ctx.value.volume,
        path: ["volume"],
      });
    }
  });
const CATEGORIES = [
  { label: "Crypto", value: "0" },
  { label: "Sports", value: "1" },
  { label: "Politics", value: "2" },
  { label: "Weather", value: "3" },
  { label: "Tech", value: "4" },
  { label: "Entertainment", value: "5" },
  { label: "Economics", value: "6" },

  { label: "Science", value: "7" },
] as const;

// function formatDate(date: Date | undefined) {
//   if (!date || !isValid(date)) {
//     return "";
//   }

//   return format(date, "MM dd, yyyy");
// }

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

const NewMarketDialog = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [open, setOpen] = React.useState(false);
  // const [date, setDate] = React.useState<Date | undefined>(new Date("2025-06-01"));
  const { address } = useAccount();
  const { data: balance } = useWatchBalance({ address });
  const formattedEThValue = balance ? Number(balance.formatted) : 0;
  // const [month, setMonth] = React.useState<Date | undefined>(date);
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync: createMarket, isMining } = useScaffoldWriteContract({ contractName: "PredictionMarket" });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      endDate: new Date(),
      title: "",
      description: "",
      volume: 0.0,
      category: "0",
      availableBalance: formattedEThValue, // Set to yesterdays date
    },
  });

  //Reset form Default values when they are ready
  useEffect(() => {
    if (formattedEThValue !== undefined) {
      form.setValue("availableBalance", formattedEThValue);
    }
  }, [formattedEThValue, form]);
  const handleCreate = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const _category = Number(data.category);
    const ms = data.endDate.getTime();
    const _endDate = Math.floor(ms / 1000);

    try {
      await createMarket(
        {
          functionName: "createMarket",
          args: [data.title, BigInt(_endDate), data.description, _category],
          value: parseEther(data.volume.toString()),
        },
        {
          onBlockConfirmation: () => {
            setIsLoading(false);
            form.reset({
              title: "",
              description: "",
              volume: 0.0,
              category: "0",
              endDate: new Date(),
              availableBalance: formattedEThValue, // keep the latest balance
            });
            // setShowCreate(false);
          },
        },
      );
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showCreate} onOpenChange={setShowCreate}>
      <DialogTrigger asChild>
        <Button
          // onClick={() => {
          //   setTab("markets");
          //   setShowCreate(true);
          // }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:maz-w-7xl">
        <form onSubmit={form.handleSubmit(handleCreate)}>
          <DialogHeader className="mb-3">
            <DialogTitle>Create New Market</DialogTitle>
          </DialogHeader>

          {/* <div className="glass-card p-6 space-y-4 animate-slide-up"> */}
          {/* <h3 className="font-semibold">Create New Market</h3> */}
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">Title</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="market-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="Will X happen by Y..?"
                      rows={4}
                      className="min-h-24 resize-none"
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-complex-billingPeriod">Category</FieldLabel>
                  <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="form-rhf-complex-billingPeriod" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Select from the predefined categories.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field className="mx-auto w-full" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date-required">End Date</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="date-required"
                      value={field.value instanceof Date ? format(field.value, "MM-dd-yyyy") : field.value || ""}
                      placeholder="June 01, 2025"
                      onChange={e => {
                        const date = new Date(e.target.value);

                        if (isValidDate(date)) {
                          field.onChange(date);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setOpen(true);
                        }
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <InputGroupButton id="date-picker" variant="ghost" size="icon-xs" aria-label="Select date">
                            <CalendarIcon />
                            <span className="sr-only">Select date</span>
                          </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="end"
                          alignOffset={-8}
                          sideOffset={10}
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            // month={month}
                            // onMonthChange={setMonth}
                            onSelect={date => {
                              //setDate(formatDate(date) as unknown as Date);
                              field.onChange(date);
                              //setValue(formatDate(date))
                              setOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-description">Resolution Criteria</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="form-rhf-demo-description"
                      placeholder="Eg. Resolves YES if a generally accepted independent evaluation confirms an AI system passes the Turing Test."
                      rows={4}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                  </InputGroup>
                  <FieldDescription>Include or add your resolution criteria .</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="volume"
              render={({ field, fieldState }) => (
                <Field className="space-y-0" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-sm text-inherit">Liquidity</FieldLabel>
                  <EtherInput
                    placeholder="0.00"
                    value={field.value?.toString() ?? ""}
                    onChange={field.onChange}
                    className="text-lg"
                    ariaInvalid={fieldState.invalid}
                    defaultUsdMode={false}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field orientation="horizontal">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  //  setShowCreate(false);
                }}
              >
                Reset
              </Button>
              <Button type="submit">
                {isLoading || isMining ? (
                  <>
                    <Spinner className="mr-2" /> Creating...
                  </>
                ) : (
                  "Create Market"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMarketDialog;
