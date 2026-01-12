"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal, Button, Input, Select } from "./ui";
import { formatCurrency } from "@/lib/utils";
import type { Product, AddProductToOrderInput } from "@/lib/types";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddProductToOrderInput & { product: Product }) => void;
  products: Product[];
}

export function AddProductModal({
  isOpen,
  onClose,
  onAdd,
  products,
}: AddProductModalProps) {
  const t = useTranslations();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [numberOfCrates, setNumberOfCrates] = useState("");
  const [unitsPerCrate, setUnitsPerCrate] = useState("");
  const [piecesPerCrate, setPiecesPerCrate] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const selectedProduct = products.find((p) => p.productId === selectedProductId);

  const totalUnits =
    numberOfCrates && unitsPerCrate
      ? parseFloat(numberOfCrates) * parseFloat(unitsPerCrate)
      : 0;

  const revenue =
    totalUnits && sellPrice ? totalUnits * parseFloat(sellPrice) : 0;

  const expense =
    selectedProduct && totalUnits
      ? totalUnits * selectedProduct.buyPricePerUnit
      : 0;

  const profit = revenue - expense;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const resetForm = () => {
    setSelectedProductId(null);
    setNumberOfCrates("");
    setUnitsPerCrate("");
    setPiecesPerCrate("");
    setSellPrice("");
  };

  const handleAdd = () => {
    if (
      !selectedProduct ||
      !numberOfCrates ||
      !unitsPerCrate ||
      !piecesPerCrate ||
      !sellPrice
    ) {
      alert(t("validation.fillAllFields"));
      return;
    }

    onAdd({
      productId: selectedProduct.productId,
      numberOfCrates: parseInt(numberOfCrates),
      unitsPerCrate: parseFloat(unitsPerCrate),
      piecesPerCrate: parseInt(piecesPerCrate),
      sellPricePerUnit: parseFloat(sellPrice),
      product: selectedProduct,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("order.addProduct")}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAdd}
            className="flex-1"
            disabled={
              !selectedProduct ||
              !numberOfCrates ||
              !unitsPerCrate ||
              !piecesPerCrate ||
              !sellPrice
            }
          >
            {t("product.addToOrder")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label={t("product.title")}
          value={selectedProductId?.toString() || ""}
          onChange={(e) =>
            setSelectedProductId(e.target.value ? parseInt(e.target.value) : null)
          }
          options={[
            { value: "", label: t("product.selectOrCreate") },
            ...products.map((p) => ({
              value: p.productId.toString(),
              label: `${p.materialName} ${p.dimensions} ${p.finishType}`,
            })),
          ]}
        />

        {selectedProduct && (
          <>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("product.supplier")}:</span>
                <span className="font-medium">{selectedProduct.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("product.buyPrice")}:</span>
                <span className="font-medium">
                  {formatCurrency(selectedProduct.buyPricePerUnit)}/
                  {selectedProduct.unitType}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {t("product.quantityDetails")}
              </h4>
              <div className="space-y-3">
                <Input
                  type="number"
                  label={t("product.crates")}
                  value={numberOfCrates}
                  onChange={(e) => setNumberOfCrates(e.target.value)}
                  placeholder="e.g., 50"
                />
                <Input
                  type="number"
                  step="0.01"
                  label={`${t("product.unitsPerCrate")} (${selectedProduct.unitType})`}
                  value={unitsPerCrate}
                  onChange={(e) => setUnitsPerCrate(e.target.value)}
                  placeholder="e.g., 1.44"
                />
                <Input
                  type="number"
                  label={t("product.piecesPerCrate")}
                  value={piecesPerCrate}
                  onChange={(e) => setPiecesPerCrate(e.target.value)}
                  placeholder="e.g., 16"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {t("product.pricing")}
              </h4>
              <Input
                type="number"
                step="0.01"
                label={`${t("product.sellPrice")} (${selectedProduct.unitType})`}
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="e.g., 12.00"
              />
            </div>

            {numberOfCrates && unitsPerCrate && sellPrice && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t("calculation.calculated")}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">
                      {t("calculation.totalUnits")}:
                    </span>
                    <span className="font-medium text-blue-900">
                      {totalUnits.toFixed(2)} {selectedProduct.unitType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">
                      {t("calculation.revenue")}:
                    </span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">
                      {t("calculation.expense")}:
                    </span>
                    <span className="font-medium text-red-700">
                      {formatCurrency(expense)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-blue-900 font-medium">
                      {t("calculation.profit")}:
                    </span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(profit)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
