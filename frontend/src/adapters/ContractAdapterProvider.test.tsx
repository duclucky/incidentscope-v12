import { render, screen } from "@testing-library/react";
import { ContractAdapterProvider, useContractAdapter } from "./ContractAdapterProvider";

function ConfigurationProbe() {
  const adapter = useContractAdapter();
  return <span>{adapter.configuration.readConfigured ? "Configured" : "Not configured"}</span>;
}

describe("ContractAdapterProvider", () => {
  it("uses the honest unconfigured adapter by default", () => {
    render(
      <ContractAdapterProvider>
        <ConfigurationProbe />
      </ContractAdapterProvider>,
    );

    expect(screen.getByText("Not configured")).toBeInTheDocument();
  });
});
