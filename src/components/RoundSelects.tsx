import { Select, SelectItem, Form, Button } from "@nextui-org/react";
import { useState } from "react";

const RoundSelects = ({ onSubmit }: { onSubmit: (round: string, question: string) => void }) => {
  const [firstSelectValue, setFirstSelectValue] = useState(""); // Round
  const [secondSelectValue, setSecondSelectValue] = useState(""); // Question
  const [secondSelectOptions, setSecondSelectOptions] = useState<string[]>([]);

  // Handle Round selection
  const handleFirstSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFirstSelectValue(value);

    // Update options for the second select based on the round
    const optionsMap: Record<string, string[]> = {
      1: ["1", "2", "3", "4", "5"],
      2: ["1", "2", "3", "4", "5"],
      3: ["1", "2", "3", "4", "5"],
      impossible: ["1", "2"],
      wager: ["Wager"],
      final: ["Final"]
    };

    setSecondSelectOptions(optionsMap[value] || []);
    setSecondSelectValue(""); // Reset question selection
  };

  // Handle Question selection
  const handleSecondSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSecondSelectValue(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(firstSelectValue, secondSelectValue); // Pass selected round and question to parent

    // Reset form
    setFirstSelectValue("");
    setSecondSelectValue("");
    setSecondSelectOptions([]);
    // enable the button
    e.currentTarget.querySelector('button')?.removeAttribute('disabled');
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <div className="flex gap-4 w-1/2">
          {/* First Select */}
          <Select
            label="Round"
            placeholder="Choose a round"
            onChange={handleFirstSelectChange}
            value={firstSelectValue}
          >
            <SelectItem key="1" value="1">
              Round 1
            </SelectItem>
            <SelectItem key="2" value="2">
              Round 2
            </SelectItem>
            <SelectItem key="3" value="3">
              Round 3
            </SelectItem>
            <SelectItem key="impossible" value="impossible">
              Impossible
            </SelectItem>
            <SelectItem key="wager" value="wager">
              Wager
            </SelectItem>
            <SelectItem key="final" value="final">
              Final
            </SelectItem>
          </Select>

          {/* Second Select */}
          <Select
            label="Question"
            placeholder="Choose a question"
            isDisabled={!firstSelectValue}
            onChange={handleSecondSelectChange}
            value={secondSelectValue}
          >
            {secondSelectOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>

          {/* Submit Button */}
          <Button type="submit" color="primary" isDisabled={!firstSelectValue || !secondSelectValue}>
            Load
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default RoundSelects;
