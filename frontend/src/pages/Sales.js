import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, DollarSign, Calculator, Printer, X, Eye, Check, RefreshCw, Edit, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { salesAPI, productsAPI, customersAPI, companiesAPI } from '../services/api';
import { cashRegisterAPI } from '../services/cashRegisterAPI';
import toast from 'react-hot-toast';

const Sales = () => {
  const { company, updateCompany } = useAuth();
  
  // Inicializar o estado do caixa baseado na company se disponível
  const initialCashRegisterState = company?.settings?.cashRegister?.isOpen ?? false;
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(initialCashRegisterState);
  const [checkingCashRegister, setCheckingCashRegister] = useState(false); // Começa como false
  const [hasCheckedInitially, setHasCheckedInitially] = useState(false); // Controle de verificação inicial
  const [showCashManagement, setShowCashManagement] = useState(false);
  const [cashAmount, setCashAmount] = useState(company?.settings?.cashRegister?.currentAmount || 0);
  const [cashAdjustment, setCashAdjustment] = useState('');
  const [cashAdjustmentReason, setCashAdjustmentReason] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('CONSUMIDOR');
  // pagamentos centralizados no estado `payments`
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  
  // Novos estados para múltiplos pagamentos
  // Unificar pagamentos em um único estado `payments`
  const [payments, setPayments] = useState([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Novos estados para detalhes do pagamento (parcelas / vencimento)
  const [paymentInstallments, setPaymentInstallments] = useState(1);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  
  // Estados para finalização
  const [showFinishSaleDialog, setShowFinishSaleDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewType, setPreviewType] = useState('thermal'); // 'thermal' ou 'a4'
  
  // Estados para configuração de impressora
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false); // se imprime automaticamente após visualizar
  
  // Estados para abertura de caixa
  const [showOpenCashDialog, setShowOpenCashDialog] = useState(false);
  const [initialCashAmount, setInitialCashAmount] = useState(0);
  
  // Estados para histórico de caixas
  const [showCashHistory, setShowCashHistory] = useState(false);
  const [cashRegisters, setCashRegisters] = useState([]);
  const [loadingCashHistory, setLoadingCashHistory] = useState(false);
  const [selectedCashRegister, setSelectedCashRegister] = useState(null);
  
  // Estados para fechamento de caixa
  const [showCloseCashDialog, setShowCloseCashDialog] = useState(false);
  const [closeCashSection, setCloseCashSection] = useState(1); // 1 = resumo, 2 = confirmação
  const [finalCashAmount, setFinalCashAmount] = useState(0);
  const [nextDayOpeningAmount, setNextDayOpeningAmount] = useState(0);
  const [todaySalesSummary, setTodaySalesSummary] = useState([]);
  const [todayAdjustments, setTodayAdjustments] = useState([]);
  const [loadingCloseData, setLoadingCloseData] = useState(false);
  const [currentOpenRegister, setCurrentOpenRegister] = useState(null);
  
  // Estados para dados do banco
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para visualização de vendas do dia
  const [showTodaySales, setShowTodaySales] = useState(false);
  const [todaySales, setTodaySales] = useState([]);
  const [loadingTodaySales, setLoadingTodaySales] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [showDeleteSaleDialog, setShowDeleteSaleDialog] = useState(false);
  
  // Estados para pesquisa de clientes
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Abrir caixa com API real
  const openCashRegister = async () => {
    try {
      // Não enviar initialAmount para usar nextDayOpeningAmount do backend
      const response = await cashRegisterAPI.open({});
      
      setIsCashRegisterOpen(true);
      // Usar o valor retornado pelo backend (currentAmount)
      const returnedAmount = response?.cashRegister?.currentAmount || response?.currentAmount || 0;
      setCashAmount(returnedAmount);
      
      console.log('Caixa aberto com valor:', returnedAmount);
      toast.success('Caixa aberto com sucesso');
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Já existe um caixa aberto hoje');
      } else {
        toast.error('Erro ao abrir caixa');
      }
    }
  };

  // Confirmar abertura de caixa com valor inicial
  const confirmOpenCashRegister = async () => {
    try {
      const response = await cashRegisterAPI.open({
        initialAmount: initialCashAmount
      });
      
      setIsCashRegisterOpen(true);
      setCashAmount(initialCashAmount);
      setShowOpenCashDialog(false);
      setInitialCashAmount(0);
      toast.success('Caixa aberto com sucesso');
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Já existe um caixa aberto hoje');
      } else {
        toast.error('Erro ao abrir caixa');
      }
    }
  };

  // Fechar caixa com API real
  const closeCashRegister = async () => {
    // Primeiro buscar o caixa aberto atual
    try {
      const openRegisters = await cashRegisterAPI.getAll({ status: 'open' });
      if (!openRegisters?.cashRegisters || openRegisters.cashRegisters.length === 0) {
        toast.error('Nenhum caixa aberto encontrado');
        return;
      }
      
      const currentRegister = openRegisters.cashRegisters[0];
      setCurrentOpenRegister(currentRegister);
      setFinalCashAmount(cashAmount);
      
      // Carregar dados para a primeira seção
      await loadCloseCashData();
      
      setShowCloseCashDialog(true);
      setCloseCashSection(1);
    } catch (error) {
      console.error('Erro ao buscar caixa aberto:', error);
      toast.error('Erro ao buscar caixa aberto');
    }
  };

  // Carregar dados para fechamento de caixa
  const loadCloseCashData = async () => {
    console.log('DEBUG - Iniciando loadCloseCashData');
    setLoadingCloseData(true);
    
    // Limpar estados anteriores para evitar cache
    setTodaySalesSummary([]);
    setTodayAdjustments([]);
    
    try {
      console.log('DEBUG - company._id:', company?._id);
      console.log('DEBUG - company object:', company);
      
      // Verificar se company existe antes de prosseguir
      if (!company || !(company._id || company.id)) {
        console.log('DEBUG - Company não disponível, usando dados vazios');
        setTodaySalesSummary([]);
        setTodayAdjustments([]);
        return;
      }
      
      const companyId = company._id || company.id;
      console.log('DEBUG - Usando companyId:', companyId);
      
      // Buscar vendas do dia com cache-buster
      const salesResponse = await salesAPI.getCurrentCashRegisterReport({ 
        _t: Date.now(),
        _cache: Math.random()
      });
      const salesData = salesResponse.data?.sales || [];
      
      console.log('DEBUG - salesResponse completo:', JSON.stringify(salesResponse, null, 2));
      console.log('DEBUG - salesData recebido:', salesData);
      console.log('DEBUG - cashRegisterId na resposta:', salesResponse.data?.cashRegisterId);
      
      // Agrupar vendas por forma de pagamento
      const paymentSummary = {};
      salesData.forEach(sale => {
        console.log('DEBUG - Processando venda:', { id: sale._id, cashRegister: sale.cashRegister, createdAt: sale.createdAt });
        sale.payments?.forEach(payment => {
          const method = payment.method;
          if (!paymentSummary[method]) {
            paymentSummary[method] = { count: 0, amount: 0 };
          }
          paymentSummary[method].count += 1;
          paymentSummary[method].amount += payment.amount || 0;
        });
      });
      
      // Buscar ajustes do caixa atual específico
      let adjustments = [];
      if (company && companyId) {
        console.log('DEBUG - Chamando getCurrentAdjustments para buscar ajustes do caixa atual');
        try {
          const adjustmentsResponse = await companiesAPI.getCurrentAdjustments();
          adjustments = adjustmentsResponse.data?.adjustments || [];
          console.log('DEBUG - adjustments encontrados no endpoint específico:', adjustments);
        } catch (error) {
          console.error('Erro ao buscar ajustes específicos:', error);
          // Fallback para método antigo
          try {
            const freshCompanyResponse = await companiesAPI.getById(companyId);
            const freshCompanyData = freshCompanyResponse.data || freshCompanyResponse;
            adjustments = freshCompanyData?.settings?.cashRegister?.adjustments || [];
            console.log('DEBUG - adjustments encontrados via fallback:', adjustments);
          } catch (fallbackError) {
            console.error('Erro no fallback:', fallbackError);
            adjustments = [];
          }
        }
      } else {
        console.log('DEBUG - Company ou companyId não disponível para buscar ajustes');
        adjustments = [];
      }
      
      // Filtrar ajustes do dia atual - corrigir fuso horário
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      console.log('DEBUG - Hoje (YYYY-MM-DD):', todayString);
      
      const todayAdjustments = adjustments.filter(adj => {
        const adjDate = new Date(adj.timestamp);
        const adjDateString = adjDate.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('DEBUG - Comparando datas (YYYY-MM-DD):', adjDateString, '===', todayString, '=', adjDateString === todayString);
        return adjDateString === todayString;
      });
      
      console.log('DEBUG - todayAdjustments (filtrados por data):', todayAdjustments);
      
      setTodaySalesSummary(Object.entries(paymentSummary).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      })));
      
      console.log('DEBUG - paymentSummary final:', paymentSummary);
      console.log('DEBUG - todaySalesSummary final:', Object.entries(paymentSummary).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      })));
      
      setTodayAdjustments(todayAdjustments);
      console.log('DEBUG - Estados atualizados - todaySalesSummary:', paymentSummary, 'todayAdjustments:', todayAdjustments.length);
    } catch (error) {
      console.error('Erro ao carregar dados do fechamento:', error);
      toast.error('Erro ao carregar dados do fechamento');
    } finally {
      setLoadingCloseData(false);
      console.log('DEBUG - loadCloseCashData finalizado');
    }
  };

  // Confirmar fechamento de caixa
  const confirmCloseCashRegister = async () => {
    try {
      const openRegisters = await cashRegisterAPI.getAll({ status: 'open' });
      if (openRegisters.cashRegisters.length === 0) {
        toast.error('Nenhum caixa aberto encontrado');
        return;
      }
      
      const currentRegister = openRegisters.cashRegisters[0];
      await cashRegisterAPI.close(currentRegister._id, {
        finalAmount: finalCashAmount,
        nextDayOpeningAmount: nextDayOpeningAmount
      });
      
      setIsCashRegisterOpen(false);
      setCashAmount(0);
      setShowCloseCashDialog(false);
      setCloseCashSection(1);
      setCartItems([]);
      setPayments([]);
      setSelectedCustomer('CONSUMIDOR');
      setNextDayOpeningAmount(0);
      toast.success('Caixa fechado com sucesso');
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast.error('Erro ao fechar caixa');
    }
  };

  // Funções do carrinho
  const adjustCash = (type) => {
    const value = parseFloat(cashAdjustment);
    if (isNaN(value) || value <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    if (!cashAdjustmentReason.trim()) {
      toast.error('Informe uma justificativa para o ajuste');
      return;
    }

    (async () => {
      try {
        // Preferir checagem pelo estado da company (mais autoritativo)
        if (!(company?.settings?.cashRegister?.isOpen)) {
          // Tentar recarregar company do servidor para sincronizar
          try {
            const fresh = await companiesAPI.getById(company?._id);
            const freshCompany = fresh.data || fresh;
            if (freshCompany) updateCompany(freshCompany);
          } catch (refreshErr) {
            console.error('Erro ao recarregar company antes do ajuste:', refreshErr);
          }
        }

        if (!(company?.settings?.cashRegister?.isOpen)) {
          // Fallback: checar na lista de cash registers abertos
          const openRes = await cashRegisterAPI.getAll({ status: 'open' });
          if (!openRes?.cashRegisters || openRes.cashRegisters.length === 0) {
            toast.error('Caixa fechado. Abra o caixa antes de ajustar o saldo.');
            return;
          }
        }

        const op = type === 'add' ? 'add' : 'remove';
        const resp = await companiesAPI.adjustCashRegister({ 
          amount: value, 
          operation: op, 
          reason: cashAdjustmentReason.trim() 
        });
        // Atualizar estado local com valor vindo do backend (mais confiável)
        const updated = resp.data.cashRegister;
        
        // Forçar atualização imediata usando o valor do backend
        const newAmount = updated?.currentAmount ?? cashAmount;
        setCashAmount(newAmount);
        
        // Atualizar company global para propagar mudança de currentAmount
        if (updateCompany && updated) updateCompany({ settings: { cashRegister: updated } });
        setCashAdjustment('');
        setCashAdjustmentReason('');
        setShowCashManagement(false);
        toast.success('Operação realizada com sucesso');
      } catch (error) {
        console.error('Erro ao ajustar caixa:', error);
        toast.error(error.response?.data?.message || 'Erro ao ajustar caixa');
      }
    })();
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.barcode === product.barcode || item._id === product._id);
    const available = product.quantity ?? product.stock ?? 0;
    if (existingItem) {
      const requested = existingItem.quantity + 1;
      if (requested > available) {
        toast.error(`Estoque insuficiente. Disponível: ${available}`);
        return;
      }
      updateQuantity(existingItem.barcode || existingItem._id, requested);
    } else {
      if (available <= 0) {
        toast.error('Produto sem estoque');
        return;
      }
      setCartItems([...cartItems, { 
        ...product, 
        quantity: 1,
        // Garantir que temos os campos necessários
        unitPrice: product.unitPrice || product.salePrice || 0,
        barcode: product.barcode || product._id
      }]);
    }
  };

  const removeFromCart = (identifier) => {
    setCartItems(cartItems.filter(item => 
      item.barcode !== identifier && item._id !== identifier
    ));
  };

  const updateQuantity = (identifier, quantity) => {
    const item = cartItems.find(i => i.barcode === identifier || i._id === identifier);
    if (!item) return;

    // Encontrar produto na lista carregada para verificar estoque
    const productRef = products.find(p => p.barcode === identifier || p._id === identifier);
    const available = productRef ? (productRef.quantity ?? productRef.stock ?? 0) : null;

    if (quantity <= 0) {
      removeFromCart(identifier);
      return;
    }

    if (available !== null && quantity > available) {
      toast.error(`Estoque insuficiente. Disponível: ${available}`);
      // Ajustar para o máximo disponível
      quantity = available;
    }

    setCartItems(cartItems.map(ci => 
      (ci.barcode === identifier || ci._id === identifier) 
        ? { ...ci, quantity } 
        : ci
    ));
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };
  const getRemaining = () => {
    return getTotal() - payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const openAddPaymentDialog = () => {
    setSelectedPaymentMethod('dinheiro');
    const remaining = getRemaining();
    setPaymentAmount(remaining > 0 ? String(remaining.toFixed(2)) : '0.00');
    setPaymentInstallments(1);
    setPaymentDueDate('');
    setShowPaymentDialog(true);
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  // Carregar histórico de caixas do banco
  const loadCashHistory = async () => {
    setLoadingCashHistory(true);
    try {
      // Usar API real de caixas
      const response = await cashRegisterAPI.getAll({ _t: Date.now() });
      
      // Formatar dados para exibição
      const formattedCashRegisters = response.cashRegisters.map(cashRegister => ({
        id: cashRegister._id,
        date: new Date(cashRegister.date).toLocaleDateString('pt-BR'),
        openTime: new Date(cashRegister.openTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        closeTime: cashRegister.closeTime 
          ? new Date(cashRegister.closeTime).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : null,
        initialAmount: cashRegister.initialAmount,
        finalAmount: cashRegister.finalAmount,
        totalSales: cashRegister.totalSales,
        salesCount: cashRegister.salesCount,
        status: cashRegister.status,
        openedBy: cashRegister.openedBy?.name || 'Usuário',
        closedBy: cashRegister.closedBy?.name || null
      }));
      
      setCashRegisters(formattedCashRegisters);
      setShowCashHistory(true);
    } catch (error) {
      console.error('Erro ao carregar histórico de caixas:', error);
      toast.error('Erro ao carregar histórico de caixas');
      setCashRegisters([]);
      setShowCashHistory(true);
    } finally {
      setLoadingCashHistory(false);
    }
  };

  // Ver detalhes do caixa
  const viewCashDetails = (cashRegister) => {
    setSelectedCashRegister(cashRegister);
    // Aqui poderia abrir um diálogo com detalhes
  };

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      // Carregar apenas produtos e clientes (essenciais para o PDV)
      const [productsRes, customersRes] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll()
      ]);

      // Extrair produtos da estrutura correta: data.products
      const productsData = productsRes.data?.products || [];
      const customersData = customersRes.data?.customers || [];

      // Produtos, clientes carregados
      setProducts(productsData);
      setCustomers(customersData);
      
      // Não verificar caixa aqui - será verificado pelo useEffect específico
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de timeout, mostrar erro amigável mas não bloquear
      if (error.code === 'ECONNABORTED') {
        toast.warning('Servidor lento. Alguns dados podem não estar disponíveis.');
      } else {
        toast.error('Erro ao carregar dados do banco');
      }
      // Valores vazios em caso de erro para não bloquear o sistema
      setProducts([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se existe caixa aberto
  const checkOpenCashRegister = async () => {
    try {
      setCheckingCashRegister(true);
      const openRegisters = await cashRegisterAPI.getAll({ status: 'open' });
      
      // Verificar se existe caixa aberto (tratando diferentes estruturas de resposta)
      const cashRegistersList = openRegisters?.cashRegisters || [];
      
      // Verificar também o estado do caixa na company como fallback
      const companyCashRegisterOpen = company?.settings?.cashRegister?.isOpen;
      
      if (cashRegistersList.length > 0 || companyCashRegisterOpen) {
        const currentRegister = cashRegistersList.length > 0 ? cashRegistersList[0] : null;
        setIsCashRegisterOpen(true);
        
        // Só atualizar cashAmount se for diferente do valor atual (evitar sobrescrever valor recém-atualizado)
        const newCashAmount = company?.settings?.cashRegister?.currentAmount ?? currentRegister?.initialAmount ?? 0;
        if (newCashAmount !== cashAmount) {
          setCashAmount(newCashAmount);
        }
        
        setCurrentOpenRegister(currentRegister);
      } else {
        setIsCashRegisterOpen(false);
        setCurrentOpenRegister(null);
      }
    } catch (error) {
      console.error('Erro ao verificar caixa aberto:', error);
      
      // Em caso de timeout, usar estado da company como fallback
      if (error.code === 'ECONNABORTED') {
        console.log('Timeout ao verificar caixa, usando estado local como fallback');
        const companyCashRegisterOpen = company?.settings?.cashRegister?.isOpen;
        if (companyCashRegisterOpen) {
          setIsCashRegisterOpen(true);
          setCashAmount(company?.settings?.cashRegister?.currentAmount || 0);
        } else {
          setIsCashRegisterOpen(false);
          setCurrentOpenRegister(null);
        }
      } else {
        // Em caso de erro, verificar o estado da company como fallback
        const companyCashRegisterOpen = company?.settings?.cashRegister?.isOpen;
        if (companyCashRegisterOpen) {
          setIsCashRegisterOpen(true);
          setCashAmount(company?.settings?.cashRegister?.currentAmount || 0);
        } else {
          setIsCashRegisterOpen(false);
          setCurrentOpenRegister(null);
        }
      }
    } finally {
      setCheckingCashRegister(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Verificação inicial e monitoramento de mudanças na company
  useEffect(() => {
    // Se ainda não verificou inicialmente e a company está disponível
    if (!hasCheckedInitially && company?.settings?.cashRegister?.isOpen !== undefined) {
      setHasCheckedInitially(true);
      checkOpenCashRegister();
    }
    // Se já verificou inicialmente, só atualizar se houver mudança real
    else if (hasCheckedInitially && company?.settings?.cashRegister?.isOpen !== undefined && !checkingCashRegister) {
      checkOpenCashRegister();
    }
  }, [company?.settings?.cashRegister?.isOpen, hasCheckedInitially]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomerDropdown && !event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomerDropdown]);

  // Filtrar produtos do banco de dados (mais tolerante a campos faltantes)
  const filteredProducts = Array.isArray(products) ? (() => {
    const q = (searchTerm || '').toString().trim().toLowerCase();
    if (!q) return products;
    return products.filter(product => {
      const description = (product.description || product.name || '').toString().toLowerCase();
      const barcode = (product.barcode || '').toString().toLowerCase();
      const brand = (product.brand || '').toString().toLowerCase();
      return description.includes(q) || barcode.includes(q) || brand.includes(q);
    });
  })() : [];

  // Removidos logs de debug para produção

  // Funções de impressão
  const printReceipt = (type, printerId = null) => {
    const printerName = printerId 
      ? availablePrinters.find(p => p.id === printerId)?.name || 'Impressora selecionada'
      : 'Impressora padrão';
    
    if (!currentSale) {
      toast.error('Nenhuma venda encontrada para imprimir');
      return;
    }
    
    try {
      // Criar conteúdo HTML para impressão
      const printContent = generatePrintContent(type, currentSale);
      
      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Comprovante de Venda</title>
            <style>
              ${type === 'thermal' ? getThermalPrintStyles() : getA4PrintStyles()}
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        
        toast.success(`Enviando comprovante ${type === 'thermal' ? 'térmico' : 'A4'} para ${printerName}`);
      } else {
        // Fallback: imprimir na janela atual
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        document.body.appendChild(printFrame);
        
        const printDoc = printFrame.contentDocument;
        printDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Comprovante de Venda</title>
            <style>
              ${type === 'thermal' ? getThermalPrintStyles() : getA4PrintStyles()}
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  parent.window.print();
                }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printDoc.close();
        
        toast.success(`Enviando comprovante ${type === 'thermal' ? 'térmico' : 'A4'} para ${printerName}`);
        
        // Remover iframe após impressão
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 2000);
      }
      
      setShowPrintDialog(false);
      setShowPrintPreview(false);
      
    } catch (error) {
      console.error('Erro ao gerar impressão:', error);
      toast.error('Erro ao gerar impressão: ' + error.message);
    }
  };

  // Gerar conteúdo HTML para impressão
  const generatePrintContent = (type, sale) => {
    if (type === 'thermal') {
      return `
        <div class="thermal-receipt">
          <div class="header">
            <h2>COMPROVANTE DE VENDA</h2>
            <p>PDV Sistema</p>
          </div>
          <div class="info">
            <p><strong>Venda:</strong> #${sale.id}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Cliente:</strong> ${sale.customer}</p>
          </div>
          <div class="items">
            <h3>ITENS</h3>
            ${sale.items?.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.description}</span>
                <span>R$ ${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>
          <div class="total">
            <div class="line">
              <span>Subtotal:</span>
              <span>R$ ${sale.total?.toFixed(2)}</span>
            </div>
            ${(sale.discount || 0) > 0 ? `
              <div class="line">
                <span>Desconto:</span>
                <span>-R$ ${sale.discount?.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="line total-line">
              <span>TOTAL:</span>
              <span>R$ ${(sale.total - (sale.discount || 0)).toFixed(2)}</span>
            </div>
          </div>
          <div class="payments">
            <h3>FORMAS DE PAGAMENTO</h3>
            ${sale.payments?.map(payment => `
              <div class="payment">
                <span>${payment.method}:</span>
                <span>R$ ${payment.amount?.toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre</p>
          </div>
        </div>
      `;
    } else {
      // Layout A4
      return `
        <div class="a4-receipt">
          <div class="header">
            <h1>COMPROVANTE DE VENDA</h1>
            <p>PDV Sistema - ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="sections">
            <div class="section">
              <h2>Dados da Venda</h2>
              <p><strong>Número:</strong> #${sale.id}</p>
              <p><strong>Cliente:</strong> ${sale.customer}</p>
              <p><strong>Vendedor:</strong> ${sale.user}</p>
            </div>
            
            <div class="section summary">
              <h2>Resumo</h2>
              <p class="total">R$ ${(sale.total - (sale.discount || 0)).toFixed(2)}</p>
              ${(sale.discount || 0) > 0 ? `
                <p class="discount">Desconto: R$ ${sale.discount?.toFixed(2)}</p>
              ` : ''}
            </div>
          </div>
          
          <div class="items-section">
            <h2>Itens Vendidos</h2>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items?.map(item => `
                  <tr>
                    <td>${item.barcode || item.product}</td>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.unitPrice?.toFixed(2)}</td>
                    <td>R$ ${(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          
          <div class="payments-section">
            <h2>Formas de Pagamento</h2>
            ${sale.payments?.map(payment => `
              <div class="payment">
                <span class="method">${payment.method}:</span>
                <span class="amount">R$ ${payment.amount?.toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>
          
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Este documento não tem valor fiscal</p>
          </div>
        </div>
      `;
    }
  };

  // Estilos para impressão térmica
  const getThermalPrintStyles = () => {
    return `
      @page {
        size: 58mm 297mm;
        margin: 3mm;
      }
      
      body {
        font-family: 'Courier New', monospace;
        font-size: 10px;
        margin: 0;
        padding: 5px;
        width: 52mm;
        line-height: 1.2;
      }
      
      .thermal-receipt {
        width: 100%;
        max-width: 52mm;
      }
      
      .header {
        text-align: center;
        margin-bottom: 15px;
      }
      
      .header h2 {
        font-size: 12px;
        font-weight: bold;
        margin: 0;
        line-height: 1.2;
      }
      
      .header p {
        font-size: 8px;
        margin: 1px 0;
        line-height: 1.1;
      }
      
      .info {
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        padding: 8px 0;
        margin: 8px 0;
      }
      
      .info p {
        margin: 1px 0;
        font-size: 9px;
        line-height: 1.1;
        word-wrap: break-word;
      }
      
      .items h3, .payments h3 {
        font-size: 10px;
        font-weight: bold;
        margin: 8px 0 4px 0;
        text-align: center;
      }
      
      .item, .payment {
        display: flex;
        justify-content: space-between;
        margin: 1px 0;
        font-size: 9px;
        line-height: 1.1;
      }
      
      .item span:first-child, .payment span:first-child {
        flex: 1;
        margin-right: 5px;
        word-wrap: break-word;
      }
      
      .item span:last-child, .payment span:last-child {
        text-align: right;
        white-space: nowrap;
        min-width: 35px;
      }
      
      .total {
        border-top: 1px dashed #000;
        padding-top: 8px;
        margin-top: 8px;
      }
      
      .total .line {
        display: flex;
        justify-content: space-between;
        margin: 1px 0;
        font-size: 9px;
      }
      
      .total-line {
        font-weight: bold;
        font-size: 11px;
        border-top: 1px solid #000;
        padding-top: 4px;
        margin-top: 4px;
      }
      
      .footer {
        text-align: center;
        margin-top: 15px;
        font-size: 8px;
        line-height: 1.1;
      }
      
      .footer p {
        margin: 2px 0;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
          width: 52mm;
        }
        
        .thermal-receipt {
          width: 52mm;
          max-width: 52mm;
        }
      }
    `;
  };

  // Estilos para impressão A4
  const getA4PrintStyles = () => {
    return `
      @page {
        size: A4;
        margin: 15mm;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        margin: 0;
        padding: 20px;
      }
      
      .a4-receipt {
        max-width: 210mm;
        margin: 0 auto;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .header h1 {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 10px 0;
      }
      
      .header p {
        color: #666;
        margin: 5px 0;
      }
      
      .sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .section h2 {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 10px 0;
      }
      
      .section p {
        margin: 5px 0;
      }
      
      .summary {
        text-align: right;
      }
      
      .summary .total {
        font-size: 24px;
        font-weight: bold;
        color: #2a9d2a;
        margin: 10px 0;
      }
      
      .summary .discount {
        color: #e74c3c;
        font-size: 14px;
      }
      
      .items-section {
        margin-bottom: 30px;
      }
      
      .items-section h2 {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 15px 0;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      
      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .payments-section h2 {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 15px 0;
      }
      
      .payment {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background-color: #f9f9f9;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .payment .method {
        font-weight: 500;
      }
      
      .payment .amount {
        font-weight: bold;
      }
      
      .footer {
        text-align: center;
        margin-top: 40px;
        color: #666;
        font-size: 12px;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        
        .sections {
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
      }
    `;
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Novas funções para múltiplos pagamentos
  const addPayment = () => {
    if (!selectedPaymentMethod || !paymentAmount) {
      toast.error('Selecione a forma de pagamento e informe o valor');
      return;
    }
    const amount = parseFloat(paymentAmount);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0) + amount;
    const saleTotal = getTotal();

    const newPayment = {
      method: selectedPaymentMethod,
      amount: amount,
      installments: paymentInstallments || 1,
      dueDate: paymentDueDate || undefined,
      timestamp: new Date()
    };
    setPayments([...payments, newPayment]);
    setChangeAmount(Math.max(0, totalPaid - saleTotal));

    // Limpar campos
    setSelectedPaymentMethod('');
    setPaymentAmount('');
    setPaymentInstallments(1);
    setPaymentDueDate('');
    setShowPaymentDialog(false);

    toast.success('Forma de pagamento adicionada');
  };

  const calculateTotalPaid = () => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Confirmar finalização da venda
  const confirmFinishSale = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Preparar dados da venda para salvar no banco
      const saleData = {
        // Enviar 'CONSUMIDOR' como string especial para o backend
        customer: selectedCustomer === 'CONSUMIDOR' ? 'CONSUMIDOR' : selectedCustomer,
        customerName: getSelectedCustomerName(),
        items: cartItems.map(item => ({
          product: item._id || item.barcode,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity
        })),
        payments: payments.map(payment => ({
          method: payment.method,
          amount: payment.amount,
          installments: payment.installments || 1,
          dueDate: payment.dueDate
        })),
        total: getTotal(),
        status: 'completed',
        cashRegister: currentOpenRegister?._id
      };

      // Salvar venda no banco
      const response = await salesAPI.create(saleData);
      const savedSale = response.data;

      // Atualizar estado local
      setCurrentSale({
        id: savedSale._id,
        saleNumber: savedSale.saleNumber,
        customer: selectedCustomer,
        customerName: getSelectedCustomerName(),
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR'),
        items: cartItems,
        payments: payments,
        total: getTotal(),
        changeAmount: changeAmount
      });
      
      // Limpar todos os campos após finalizar
      setCartItems([]);
      setPayments([]);
      setSelectedCustomer('CONSUMIDOR');
      setCustomerSearchTerm('CONSUMIDOR');
      setSearchTerm('');
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      setShowFinishSaleDialog(false);

      // Mostrar diálogo de impressão se houver venda finalizada
      if (savedSale) {
        setShowPrintDialog(true);
      }

      toast.success('Venda realizada com sucesso!');
      
      // Atualizar cashAmount com o valor mais recente da company (atualizado pelo backend)
      try {
        const freshCompany = await companiesAPI.getById(company._id);
        const freshData = freshCompany.data || freshCompany;
        if (freshData?.settings?.cashRegister?.currentAmount !== undefined) {
          setCashAmount(freshData.settings.cashRegister.currentAmount);
          if (updateCompany) updateCompany(freshData);
        }
      } catch (e) {
        console.error('Erro ao buscar company atualizada:', e);
        // Fallback: adicionar o valor da venda ao cashAmount atual
        if (savedSale && savedSale.total) {
          setCashAmount(prev => prev + savedSale.total);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error.response?.data || error);
      // Mostrar detalhes de validação quando disponíveis
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.errors) {
          console.error('Detalhes de validação:', data.errors);
          toast.error(data.errors.map(e => e.msg).join(' | '));
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Erro ao realizar venda');
        }
      } else {
        toast.error('Erro ao realizar venda');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para gerenciar configurações da impressora
  const getAvailablePrinters = async (showMessages = false) => {
    setLoadingPrinters(true);
    try {
      console.log('Buscando impressoras disponíveis no sistema...');
      
      // Usar o backend para buscar impressoras reais do Windows
      const response = await companiesAPI.getPrinters();
      
      if (response.data && response.data.success) {
        const printers = response.data.printers.map(printer => ({
          name: printer.name,
          id: printer.id,
          isDefault: printer.isDefault || false,
          driver: printer.driver || 'Desconhecido',
          type: printer.type || 'Desconhecido'
        }));
        
        setAvailablePrinters(printers);
        
        // Salvar impressoras em cache
        localStorage.setItem('pdv_available_printers', JSON.stringify(printers));
        localStorage.setItem('pdv_printers_timestamp', Date.now().toString());
        
        // Verificar se a impressora selecionada ainda existe
        if (selectedPrinter && !printers.find(p => p.id === selectedPrinter)) {
          console.log('Impressora selecionada não encontrada, limpando seleção');
          setSelectedPrinter('');
          // Salvar configuração atualizada
          savePrinterSettings();
        }
        
        // Só mostrar mensagens se showMessages for true (quando abre diálogo)
        if (showMessages) {
          if (printers.length > 0) {
            const defaultPrinter = printers.find(p => p.isDefault);
            if (defaultPrinter) {
              toast.success(`${printers.length} impressora(s) encontrada(s). Padrão: ${defaultPrinter.name}`);
            } else {
              toast.success(`${printers.length} impressora(s) encontrada(s)`);
            }
          } else {
            toast('Nenhuma impressora encontrada no sistema.');
          }
        }
      } else {
        throw new Error(response.data?.message || 'Falha ao buscar impressoras');
      }
      
    } catch (error) {
      console.error('Erro ao buscar impressoras:', error);
      
      // Se falhar a API do backend, tentar métodos do navegador
      let printers = [];
      
      // Método 1: Usar a API de impressão do navegador (Chrome/Edge)
      if (navigator.print) {
        try {
          // Criar um iframe para acessar o diálogo de impressão
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.style.position = 'absolute';
          iframe.style.left = '-9999px';
          document.body.appendChild(iframe);
          
          // Tentar acessar as impressoras através do contentWindow
          const printWindow = iframe.contentWindow;
          if (printWindow && printWindow.print) {
            // Simular o diálogo para forçar a detecção de impressoras
            printWindow.document.write('<html><body><script>window.print();</script></body></html>');
            printWindow.document.close();
            
            // Aguardar um pouco para o navegador detectar as impressoras
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          document.body.removeChild(iframe);
        } catch (e) {
          console.log('Método do navegador falhou:', e);
        }
      }
      
      // Se ainda não encontrou impressoras, usar fallback
      if (printers.length === 0) {
        // Tentar detectar impressoras através de heurística de sistema
        const userAgent = navigator.userAgent;
        let detectedPrinters = [];
        
        if (userAgent.includes('Windows')) {
          // Impressoras Windows padrão que geralmente estão instaladas
          detectedPrinters = [
            { name: 'Microsoft Print to PDF', id: 'Microsoft_Print_to_PDF', isDefault: false },
            { name: 'Microsoft XPS Document Writer', id: 'Microsoft_XPS_Document_Writer', isDefault: false },
            { name: 'Fax', id: 'Fax', isDefault: false },
            { name: 'OneNote for Windows 10', id: 'OneNote', isDefault: false },
            { name: 'Send to OneNote', id: 'Send_To_OneNote', isDefault: false }
          ];
          
          // Tentar detectar impressoras de rede comuns
          const networkPrinters = [
            { name: '\\\\SERVER\\PRINTER1', id: 'NETWORK_PRINTER1', isDefault: false },
            { name: '\\\\SERVER\\PRINTER2', id: 'NETWORK_PRINTER2', isDefault: false }
          ];
          
          detectedPrinters = detectedPrinters.concat(networkPrinters);
        }
        
        printers = detectedPrinters;
        if (showMessages) {
          toast('Backend não disponível. Usando lista padrão do Windows.');
        }
      }
      
      // Filtrar impressoras únicas
      const uniquePrinters = printers.filter((printer, index, self) => 
        index === self.findIndex((p) => p.id === printer.id)
      );
      
      setAvailablePrinters(uniquePrinters);
      
      // Salvar impressoras em cache (fallback)
      localStorage.setItem('pdv_available_printers', JSON.stringify(uniquePrinters));
      localStorage.setItem('pdv_printers_timestamp', Date.now().toString());
      
      // Verificar se a impressora selecionada ainda existe
      if (selectedPrinter && !uniquePrinters.find(p => p.id === selectedPrinter)) {
        console.log('Impressora selecionada não encontrada no fallback, limpando seleção');
        setSelectedPrinter('');
        savePrinterSettings();
      }
      
      // Só mostrar mensagens se showMessages for true
      if (showMessages) {
        if (uniquePrinters.length > 0) {
          toast.success(`${uniquePrinters.length} impressora(s) encontrada(s) via fallback`);
        } else {
          toast.error('Nenhuma impressora encontrada. Verifique as conexões.');
        }
      }
      
    } finally {
      setLoadingPrinters(false);
    }
  };

  const savePrinterSettings = () => {
    localStorage.setItem('pdv_printer_settings', JSON.stringify({
      selectedPrinter,
      autoPrint
    }));
    toast.success('Configurações da impressora salvas!');
  };

  const loadPrinterSettings = () => {
    try {
      const saved = localStorage.getItem('pdv_printer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSelectedPrinter(settings.selectedPrinter || '');
        setAutoPrint(settings.autoPrint || false);
        
        // Verificar se temos impressoras disponíveis salvas
        const savedPrinters = localStorage.getItem('pdv_available_printers');
        if (savedPrinters) {
          try {
            const printers = JSON.parse(savedPrinters);
            // Verificar se as impressoras salvas são recentes (menos de 1 hora)
            const timestamp = localStorage.getItem('pdv_printers_timestamp');
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            
            if (timestamp && (now - parseInt(timestamp)) < oneHour) {
              setAvailablePrinters(printers);
              console.log('Usando impressoras em cache:', printers.length);
            }
          } catch (e) {
            console.log('Erro ao carregar impressoras em cache:', e);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da impressora:', error);
    }
  };

  const handlePrintWithSettings = (type) => {
    setPreviewType(type);
    if (autoPrint) {
      // Se autoPrint estiver ativo, imprime direto
      printReceipt(type, selectedPrinter);
      setShowPrintDialog(false);
    } else {
      // Senão, mostra pré-visualização
      setShowPrintPreview(true);
    }
  };

  // Carregar configurações ao iniciar
  useEffect(() => {
    loadPrinterSettings();
    // Só buscar impressoras se não tiver em cache ou se o cache estiver expirado
    const savedPrinters = localStorage.getItem('pdv_available_printers');
    const timestamp = localStorage.getItem('pdv_printers_timestamp');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!savedPrinters || !timestamp || (now - parseInt(timestamp)) >= oneHour) {
      // Cache vazio ou expirado, buscar novas impressoras (sem mostrar mensagens)
      getAvailablePrinters(false);
    }
  }, []);

  // Carregar impressoras quando abrir diálogo de configurações (com mensagens)
  useEffect(() => {
    if (showPrinterSettings) {
      // Sempre buscar quando abre diálogo para garantir dados atualizados
      getAvailablePrinters(true);
    }
  }, [showPrinterSettings]);

  // Carregar vendas do caixa atual
  const loadTodaySales = async () => {
    console.log('DEBUG - Iniciando loadTodaySales');
    setLoadingTodaySales(true);
    try {
      // Obter vendas do caixa atual usando o novo endpoint com cache-buster
      const response = await salesAPI.getCurrentCashRegisterReport({
        _t: Date.now(),
        _cache: Math.random()
      });
      
      console.log('DEBUG - Response:', response.data);
      
      if (response.data && response.data.sales) {
        console.log('DEBUG - Vendas encontradas:', response.data.sales.length);
        
        // Formatar os dados das vendas para o frontend
        const formattedSales = response.data.sales.map(sale => ({
          ...sale,
          // Converter ID para string
          id: sale.id?.toString() || sale._id?.toString(),
          // Formatar data e hora
          date: new Date(sale.createdAt).toLocaleDateString('pt-BR'),
          time: new Date(sale.createdAt).toLocaleTimeString('pt-BR'),
          // Garantir que temos os campos necessários
          customer: sale.customer?.fullName || sale.customerName || 'CONSUMIDOR',
          itemsCount: sale.items?.length || 0,
          paymentMethods: sale.payments || []
        }));
        
        console.log('DEBUG - Vendas formatadas:', formattedSales);
        setTodaySales(formattedSales);
      } else {
        console.log('DEBUG - Nenhuma venda encontrada');
        setTodaySales([]);
      }
      
      // Abrir o diálogo de vendas
      console.log('DEBUG - Abrindo diálogo de vendas');
      setShowTodaySales(true);
    } catch (error) {
      console.error('Erro ao carregar vendas do dia:', error);
      toast.error('Erro ao carregar vendas do dia');
      setTodaySales([]);
      // Mesmo com erro, abrir o diálogo para mostrar mensagem
      setShowTodaySales(true);
    } finally {
      setLoadingTodaySales(false);
    }
  };

  // Funções para manipular vendas
  const handleEditSale = (sale) => {
    // Carregar a venda para edição
    try {
      // Fechar o diálogo de vendas do dia primeiro
      setShowTodaySales(false);
      
      // Limpar carrinho atual
      setCartItems([]);
      
      // Adicionar itens da venda ao carrinho
      if (sale.items && sale.items.length > 0) {
        const formattedItems = sale.items.map(item => ({
          ...item,
          product: item._id || item.product,
          description: item.description || item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          totalPrice: item.totalPrice || (item.unitPrice * item.quantity)
        }));
        
        setCartItems(formattedItems);
      }
      
      // Definir cliente
      if (sale.customer && sale.customer !== 'CONSUMIDOR') {
        setSelectedCustomer(sale.customer._id || sale.customer);
        setCustomerSearchTerm(sale.customer.fullName || sale.customer);
      } else {
        setSelectedCustomer('CONSUMIDOR');
        setCustomerSearchTerm('CONSUMIDOR');
      }
      
      // Calcular totais
      const itemsTotal = sale.items?.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice * item.quantity)), 0) || 0;
      
      // Mostrar diálogo de finalização para edição
      setCurrentSale({
        ...sale,
        items: sale.items || [],
        total: itemsTotal,
        discount: sale.discount || 0,
        payments: sale.payments || []
      });
      
      // Abrir diálogo de finalização após um pequeno delay
      setTimeout(() => {
        setShowFinishSaleDialog(true);
      }, 300);
      
      toast.success('Venda carregada para edição');
    } catch (error) {
      console.error('Erro ao carregar venda para edição:', error);
      toast.error('Erro ao carregar venda para edição');
    }
  };

  const handleDeleteSale = (sale) => {
    setSaleToDelete(sale);
    setShowDeleteSaleDialog(true);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;
    
    try {
      // Usar o ID formatado (string) para cancelar a venda
      const saleId = saleToDelete.id || saleToDelete._id;
      
      await salesAPI.cancel(saleId, {
        reason: 'Venda cancelada pelo usuário'
      });
      
      toast.success('Venda cancelada com sucesso');
      setShowDeleteSaleDialog(false);
      setSaleToDelete(null);
      
      // Recarregar vendas do dia
      loadTodaySales();
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      toast.error('Erro ao cancelar venda: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePrintSaleReceipt = (sale) => {
    try {
      // Criar estrutura de dados para impressão
      const printSale = {
        id: sale.saleNumber,
        customer: sale.customer || 'CONSUMIDOR',
        user: sale.user || 'Vendedor',
        date: sale.date,
        time: sale.time,
        total: sale.total,
        discount: sale.discount || 0,
        items: sale.items || [],
        payments: sale.paymentMethods || []
      };
      
      // Definir venda atual para impressão
      setCurrentSale(printSale);
      
      // Mostrar diálogo de impressão
      setShowPrintDialog(true);
      
      toast.success('Preparando impressão do comprovante');
    } catch (error) {
      console.error('Erro ao preparar impressão:', error);
      toast.error('Erro ao preparar impressão');
    }
  };

  // Mostrar detalhes do caixa aberto
  const showCurrentCashRegisterDetails = () => {
    if (currentOpenRegister) {
      const openTime = new Date(currentOpenRegister.openTime).toLocaleTimeString('pt-BR');
      const openDate = new Date(currentOpenRegister.date).toLocaleDateString('pt-BR');
      
      toast.success(`Caixa aberto em ${openDate} às ${openTime}`);
    }
  };

  // Funções para pesquisa de clientes
  const handleCustomerSearch = (term) => {
    setCustomerSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    const q = term.toString().trim().toLowerCase();
    const filtered = Array.isArray(customers) ? customers.filter(customer => {
      const name = (customer.fullName || customer.name || '').toString().toLowerCase();
      const email = (customer.email || '').toString().toLowerCase();
      const phone = (customer.phone || '').toString().toLowerCase();
      const document = (customer.document || '').toString().toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || document.includes(q);
    }) : [];

    setFilteredCustomers(filtered);
    setShowCustomerDropdown(true);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer._id);
    setCustomerSearchTerm(customer.fullName);
    setShowCustomerDropdown(false);
    setFilteredCustomers([]);
  };

  const selectConsumer = () => {
    setSelectedCustomer('CONSUMIDOR');
    setCustomerSearchTerm('CONSUMIDOR');
    setShowCustomerDropdown(false);
    setFilteredCustomers([]);
  };

  const getSelectedCustomerName = () => {
    if (selectedCustomer === 'CONSUMIDOR') return 'CONSUMIDOR';
    if (!selectedCustomer) return 'Não selecionado';
    
    const customer = customers.find(c => c._id === selectedCustomer);
    return customer ? customer.fullName : selectedCustomer;
  };

  // Se está verificando o caixa E ainda não tem estado inicial definido, mostrar loading
  if (checkingCashRegister && !hasCheckedInitially) {
    return (
      <div className="container-responsive flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verificando status do caixa...</p>
        </div>
      </div>
    );
  }

  // Se o caixa está fechado e não está mais verificando
  if (!isCashRegisterOpen) {
    return (
      <div className="container-responsive flex items-center justify-center min-h-screen">
        <div className="card max-w-md w-full">
          <div className="card-header text-center">
            <h2 className="card-title text-2xl">Caixa Fechado</h2>
          </div>
          <div className="card-content text-center">
            <p className="text-gray-600 mb-6">O caixa está fechado. Abra o caixa para iniciar as vendas.</p>
            <button onClick={openCashRegister} className="btn btn-primary w-full">
              Abrir Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ponto de Venda</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Saldo Caixa: </span>
            <span className="font-bold text-green-600">R$ {cashAmount ? cashAmount.toFixed(2) : '0.00'}</span>
          </div>
          <button 
            onClick={() => setShowCashManagement(true)}
            className="btn btn-secondary p-2"
            title="Gerenciar caixa"
          >
            <Calculator className="w-5 h-5" />
          </button>
          <button 
            onClick={loadCashHistory}
            className="btn btn-secondary p-2"
            title="Ver histórico de caixas"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button 
            onClick={loadTodaySales}
            className="btn btn-secondary p-2"
            title="Ver vendas do caixa atual"
          >
            <Calculator className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowPrinterSettings(true)}
            className="btn btn-secondary p-2"
            title="Configurar impressora"
          >
            <Printer className="w-5 h-5" />
          </button>
          {currentOpenRegister && (
            <button 
              onClick={showCurrentCashRegisterDetails}
              className="btn btn-info p-2"
              title="Ver detalhes do caixa aberto"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
          {isCashRegisterOpen && (
            <button 
              onClick={closeCashRegister}
              className="btn btn-warning p-2"
            >
              Fechar Caixa
            </button>
          )}
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente e Data/Hora */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Informações da Venda</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative customer-search-container">
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Pesquisar cliente..."
                      className="input pl-10"
                      value={customerSearchTerm}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                    />
                    {showCustomerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {/* Opção CONSUMIDOR - sempre visível */}
                        <div
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                          onClick={selectConsumer}
                        >
                          <div className="font-medium text-gray-900">CONSUMIDOR</div>
                          <div className="text-sm text-gray-500">Cliente padrão</div>
                        </div>
                        
                        {/* Clientes filtrados ou todos se campo estiver vazio */}
                        {(customerSearchTerm.trim() === '' ? customers : filteredCustomers).map((customer) => (
                          <div
                            key={customer._id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="font-medium text-gray-900">{customer.fullName}</div>
                            <div className="text-sm text-gray-500">
                              {customer.document && <div>{customer.document}</div>}
                              {customer.email && <div>{customer.email}</div>}
                              {customer.phone && <div>{customer.phone}</div>}
                            </div>
                          </div>
                        ))}
                        
                        {filteredCustomers.length === 0 && customerSearchTerm.trim() !== '' && (
                          <div className="p-3 text-gray-500 text-center">
                            Nenhum cliente encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Cliente selecionado */}
                  {selectedCustomer && (
                    <div className="mt-2 text-sm text-gray-600">
                      Cliente: <span className="font-medium">{getSelectedCustomerName()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('pt-BR')}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora</label>
                  <input
                    type="text"
                    value={new Date().toLocaleTimeString('pt-BR')}
                    disabled
                    className="input bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de Itens */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Selecionar Itens</h3>
            </div>
            <div className="card-content">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar por descrição ou código de barras..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Lista de Itens no Carrinho */}
              {cartItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Itens na Venda</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm">Código</th>
                          <th className="px-4 py-2 text-left text-sm">Descrição</th>
                          <th className="px-4 py-2 text-right text-sm">Valor Unit.</th>
                          <th className="px-4 py-2 text-center text-sm">Qtd</th>
                          <th className="px-4 py-2 text-right text-sm">Total</th>
                          <th className="px-4 py-2 text-center text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.barcode || item._id} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.barcode}</td>
                            <td className="px-4 py-2 text-sm">{item.description}</td>
                            <td className="px-4 py-2 text-right text-sm">R$ {item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity ?? 1}
                                onChange={(e) => updateQuantity(item.barcode || item._id, parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-sm">R$ {((item.unitPrice || 0) * item.quantity).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => removeFromCart(item.barcode || item._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resultados da pesquisa de produtos (autocomplete compacto) */}
              {searchTerm.trim() !== '' && (
                <div className="mt-2">
                  <h4 className="font-medium mb-2">Produtos</h4>
                  {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-2">Nenhum produto encontrado para "{searchTerm}"</p>
                  ) : (
                    <ul className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                      {filteredProducts.slice(0, 8).map((product) => (
                        <li
                          key={product._id || product.barcode}
                          className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <div className="font-medium text-sm">{product.description || product.name}</div>
                            <div className="text-xs text-gray-500">{product.barcode} • {product.brand || ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">R$ {product.unitPrice ? product.unitPrice.toFixed(2) : '0.00'}</div>
                            <div className="text-xs text-gray-500">Estoque: {product.quantity || product.stock || 0}</div>
                          </div>
                        </li>
                      ))}
                      {filteredProducts.length > 8 && (
                        <li className="p-2 text-center text-sm text-gray-500">Mostrando 8 de {filteredProducts.length} resultados</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Formas de Pagamento</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {payments.map((method, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <select
                      value={method.method}
                      onChange={(e) => updatePayment(index, 'method', e.target.value)}
                      className="input flex-1"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="promissoria">Promissória</option>
                      <option value="parcelado">Parcelado</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={method.amount ?? 0}
                      onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="input w-32"
                      placeholder="Valor"
                    />
                    <button
                      onClick={() => removePayment(index)}
                      className="btn btn-error btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={openAddPaymentDialog}
                  className="btn btn-secondary w-full py-2 flex items-center justify-center gap-2"
                  disabled={payments.reduce((sum, p) => sum + (p.amount || 0), 0) >= getTotal()}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Forma de Pagamento
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total da Venda:</span>
                  <span className="text-xl font-bold text-green-600">R$ {getTotal() ? getTotal().toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total Pago:</span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setShowFinishSaleDialog(true)}
                  className="btn btn-success w-full py-3 flex items-center justify-center gap-2 text-base font-medium"
                  disabled={calculateTotalPaid() < getTotal() || cartItems.length === 0}
                >
                  <DollarSign className="w-5 h-5" />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Resumo da Venda</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{getSelectedCustomerName()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Itens:</span>
                  <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {getTotal() ? getTotal().toFixed(2) : '0.00'}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {getTotal() ? getTotal().toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Gestão de Caixa */}
      {showCashManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold mb-6">Gestão de Caixa</h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Saldo atual</p>
                <p className="text-2xl font-bold text-green-600">R$ {cashAmount ? cashAmount.toFixed(2) : '0.00'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor para ajustar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAdjustment}
                  onChange={(e) => setCashAdjustment(e.target.value)}
                  className="input w-full text-lg"
                  placeholder="0,00"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justificativa *
                </label>
                <textarea
                  value={cashAdjustmentReason}
                  onChange={(e) => setCashAdjustmentReason(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Descreva o motivo do ajuste (ex: troco, pagamento de fornecedor, sangria, etc.)"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => adjustCash('add')}
                className="btn btn-primary flex-1 py-3 text-base font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Adicionar Dinheiro
                </div>
              </button>
              <button
                onClick={() => adjustCash('remove')}
                className="btn btn-warning flex-1 py-3 text-base font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <Minus className="w-5 h-5" />
                  Retirar Dinheiro
                </div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setCashAdjustment('');
                setCashAdjustmentReason('');
                setShowCashManagement(false);
              }}
              className="btn btn-secondary w-full mt-3 py-3 text-base font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Impressão - Agora com pré-visualização direta */}
      {showPrintDialog && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Opções de Impressão</h3>
              <button
                onClick={() => setShowPrintDialog(false)}
                className="btn btn-secondary p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selecione o formato para visualizar o comprovante:</p>
              <div className="border rounded p-3 bg-gray-50">
                <p className="text-sm"><strong>Venda #{currentSale.id}</strong></p>
                <p className="text-sm">Cliente: {currentSale.customer}</p>
                <p className="text-sm">Total: R$ {currentSale.total ? currentSale.total.toFixed(2) : '0.00'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handlePrintWithSettings('thermal')}
                className="btn btn-primary py-4 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <div>
                  <div className="font-medium">Visualizar Térmica</div>
                  <div className="text-xs opacity-75">Formato para impressora não fiscal</div>
                </div>
              </button>
              <button
                onClick={() => handlePrintWithSettings('a4')}
                className="btn btn-primary py-4 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                <div>
                  <div className="font-medium">Visualizar A4</div>
                  <div className="text-xs opacity-75">Formato para impressora comum</div>
                </div>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowPrintDialog(false)}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Pré-visualização de Impressão */}
      {showPrintPreview && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Pré-visualização {previewType === 'thermal' ? 'Térmica' : 'A4'}
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="btn btn-secondary p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Conteúdo da pré-visualização */}
            <div className="border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50">
              {previewType === 'thermal' ? (
                /* Layout Térmica */
                <div className="text-xs font-mono bg-white p-4" style={{ width: '300px' }}>
                  <div className="text-center mb-3">
                    <h2 className="text-lg font-bold">COMPROVANTE DE VENDA</h2>
                    <p className="text-xs">PDV Sistema</p>
                  </div>
                  <div className="border-t border-b py-2">
                    <p><strong>Venda:</strong> #{currentSale.id}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Cliente:</strong> {currentSale.customer}</p>
                  </div>
                  <div className="py-2">
                    <h3 className="font-bold mb-2">ITENS</h3>
                    {currentSale.items?.map((item, index) => (
                      <div key={index} className="flex justify-between mb-1">
                        <span>{item.quantity}x {item.description}</span>
                        <span>R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between mb-1">
                      <span>Subtotal:</span>
                      <span>R$ {currentSale.total?.toFixed(2)}</span>
                    </div>
                    {currentSale.discount > 0 && (
                      <div className="flex justify-between mb-1">
                        <span>Desconto:</span>
                        <span>-R$ {currentSale.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL:</span>
                      <span>R$ {(currentSale.total - (currentSale.discount || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <h3 className="font-bold mb-2">FORMAS DE PAGAMENTO</h3>
                    {currentSale.paymentMethods?.map((payment, index) => (
                      <div key={index} className="flex justify-between mb-1">
                        <span>{payment.method}:</span>
                        <span>R$ {payment.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-4 text-xs">
                    <p>Obrigado pela preferência!</p>
                    <p>Volte sempre</p>
                  </div>
                </div>
              ) : (
                /* Layout A4 */
                <div className="bg-white p-8" style={{ width: '210mm' }}>
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">COMPROVANTE DE VENDA</h1>
                    <p className="text-gray-600">PDV Sistema - {new Date().toLocaleString('pt-BR')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Dados da Venda</h2>
                      <p><strong>Número:</strong> #{currentSale.id}</p>
                      <p><strong>Cliente:</strong> {currentSale.customer}</p>
                      <p><strong>Vendedor:</strong> {currentSale.user}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-semibold mb-2">Resumo</h2>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {(currentSale.total - (currentSale.discount || 0)).toFixed(2)}
                      </p>
                      {currentSale.discount > 0 && (
                        <p className="text-red-600">
                          Desconto: R$ {currentSale.discount?.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Itens Vendidos</h2>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Código</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-center p-2">Qtd</th>
                          <th className="text-right p-2">Unit.</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSale.items?.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.barcode || item.product}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">R$ {item.unitPrice?.toFixed(2)}</td>
                            <td className="text-right p-2">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Formas de Pagamento</h2>
                    <div className="space-y-2">
                      {currentSale.paymentMethods?.map((payment, index) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{payment.method}:</span>
                          <span className="font-bold">R$ {payment.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center text-gray-600 text-sm mt-8">
                    <p>Obrigado pela preferência!</p>
                    <p>Este documento não tem valor fiscal</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="btn btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => {
                  printReceipt(previewType, selectedPrinter);
                  setShowPrintPreview(false);
                  setShowPrintDialog(false);
                }}
                className="btn btn-primary flex-1 py-2 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir {previewType === 'thermal' ? 'Térmica' : 'A4'}
                {selectedPrinter && ` em ${availablePrinters.find(p => p.id === selectedPrinter)?.name}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Abrir Caixa */}
      {showOpenCashDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Abrir Caixa</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Informe o valor inicial que será colocado no caixa:</p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCashAmount}
                onChange={(e) => setInitialCashAmount(parseFloat(e.target.value) || 0)}
                className="input w-full"
                placeholder="0,00"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Atenção:</strong> Este valor será registrado como o saldo inicial do caixa.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOpenCashDialog(false)}
                className="btn btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={confirmOpenCashRegister}
                className="btn btn-primary flex-1 py-2 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Adicionar Pagamento */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Adicionar Forma de Pagamento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Selecione...</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="promissoria">Promissória</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input w-full"
                  placeholder="0,00"
                />
              </div>

              {/* Campos extras para boleto/parcelado */}
              {selectedPaymentMethod === 'parcelado' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={paymentInstallments}
                    onChange={(e) => setPaymentInstallments(parseInt(e.target.value) || 1)}
                    className="input w-full"
                  />
                </div>
              )}

              {(selectedPaymentMethod === 'boleto' || selectedPaymentMethod === 'promissoria') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Data de vencimento</label>
                  <input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentDialog(false)}
                  className="btn btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={addPayment}
                  className="btn btn-primary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Finalizar Venda */}
      {showFinishSaleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Finalizar Venda</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span>Total da Venda:</span>
                  <span className="font-semibold">{formatCurrency(getTotal())}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Total Pago:</span>
                  <span className="font-semibold">{formatCurrency(calculateTotalPaid())}</span>
                </div>
                {changeAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Troco:</span>
                    <span className="font-semibold">{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishSaleDialog(false)}
                  className="btn btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={confirmFinishSale}
                  className="btn btn-primary flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Fechar Caixa - Duas Seções */}
      {showCloseCashDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Fechamento de Caixa</h3>
              <button
                onClick={() => {
                  setShowCloseCashDialog(false);
                  setCloseCashSection(1);
                  setNextDayOpeningAmount(0);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Seção 1: Resumo de Pagamentos e Ajustes */}
            {closeCashSection === 1 && (
              <div>
                <h3 className="text-xl font-bold mb-6">Resumo do Caixa - {new Date().toLocaleDateString('pt-BR')}</h3>
                
                {loadingCloseData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="ml-3 text-gray-600">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Formas de Pagamento */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">Formas de Pagamento</h4>
                      
                      {todaySalesSummary.length > 0 ? (
                        <div className="space-y-3">
                          {todaySalesSummary.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <span className="font-medium text-gray-700 capitalize">
                                  {payment.method === 'dinheiro' ? 'Dinheiro' : 
                                   payment.method === 'cartao' ? 'Cartão' : 
                                   payment.method === 'pix' ? 'PIX' : 
                                   payment.method}
                                </span>
                                <div className="text-sm text-gray-500">
                                  {payment.count} {payment.count === 1 ? 'venda' : 'vendas'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-green-600">
                                  R$ {payment.amount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Nenhuma venda registrada hoje</p>
                      )}
                    </div>

                    {/* Gráfico de Pagamentos */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">Distribuição de Pagamentos</h4>
                      
                      {todaySalesSummary.length > 0 ? (
                        <div className="space-y-3">
                          {todaySalesSummary.map((payment, index) => (
                            <div key={index} className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600 capitalize">
                                  {payment.method === 'dinheiro' ? 'Dinheiro' : 
                                   payment.method === 'cartao' ? 'Cartão' : 
                                   payment.method === 'pix' ? 'PIX' : 
                                   payment.method}
                                </span>
                                <span className="font-medium">
                                  {((payment.amount / todaySalesSummary.reduce((sum, p) => sum + p.amount, 0)) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(payment.amount / todaySalesSummary.reduce((sum, p) => sum + p.amount, 0)) * 100}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Sem dados para o gráfico</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Ajustes do Dia */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Ajustes do Caixa</h4>
                  
                  {todayAdjustments.length > 0 ? (
                    <div className="space-y-2">
                      {todayAdjustments.map((adj, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">
                              {adj.operation === 'add' ? '➕ Inclusão' : '➖ Retirada'}
                            </div>
                            <div className="text-sm text-gray-600">{adj.reason}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(adj.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="font-bold text-lg">
                            <span className={adj.operation === 'add' ? 'text-green-600' : 'text-red-600'}>
                              R$ {adj.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum ajuste registrado hoje</p>
                  )}
                </div>

                {/* Botão Continuar */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setCloseCashSection(2)}
                    className="btn btn-primary px-8 py-3 text-lg font-medium"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Seção 2: Confirmação de Fechamento */}
            {closeCashSection === 2 && (
              <div>
                <h3 className="text-xl font-bold mb-6">Confirmar Fechamento do Caixa</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Resumo Financeiro */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">Resumo Financeiro</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo Inicial:</span>
                        <span className="font-medium">R$ {currentOpenRegister?.initialAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total em Vendas:</span>
                        <span className="font-medium text-green-600">
                          R$ {todaySalesSummary.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total em Ajustes:</span>
                        <span className="font-medium">
                          R$ {todayAdjustments.reduce((sum, adj) => 
                            sum + (adj.operation === 'add' ? adj.amount : -adj.amount), 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold">Saldo Esperado:</span>
                          <span className="text-lg font-bold text-blue-600">
                            R$ {(currentOpenRegister?.initialAmount + 
                                todaySalesSummary.reduce((sum, p) => sum + p.amount, 0) +
                                todayAdjustments.reduce((sum, adj) => 
                                  sum + (adj.operation === 'add' ? adj.amount : -adj.amount), 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valor para Próximo Dia */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Configurar Próximo Dia</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor para o Caixa do Dia Seguinte:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={nextDayOpeningAmount}
                          onChange={(e) => setNextDayOpeningAmount(parseFloat(e.target.value) || 0)}
                          className="input w-full text-lg"
                          placeholder="0,00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Este valor será o saldo inicial quando o próximo caixa for aberto
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Atenção:</strong> Ao confirmar, o caixa atual será fechado e o próximo caixa iniciará com R$ {nextDayOpeningAmount.toFixed(2)}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setCloseCashSection(1)}
                    className="btn btn-secondary flex-1 py-3 text-base font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Voltar
                  </button>
                  <button
                    onClick={confirmCloseCashRegister}
                    className="btn btn-warning flex-1 py-3 text-base font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Fechar Caixa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diálogo de Histórico de Caixas */}
      {showCashHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Histórico de Caixas</h3>
              <button
                onClick={() => setShowCashHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingCashHistory ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {cashRegisters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum caixa encontrado
                  </div>
                ) : (
                  cashRegisters.map((cashRegister) => (
                    <div key={cashRegister.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Caixa do dia {cashRegister.date}</h4>
                          <p className="text-sm text-gray-600">
                            Aberto: {cashRegister.openTime} • Fechado: {cashRegister.closeTime}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vendas: {cashRegister.salesCount} • Total: R$ {cashRegister.totalSales ? cashRegister.totalSales.toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Saldo Final</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(
                              cashRegister.finalAmount ?? (company?.settings?.cashRegister?.currentAmount ?? ((cashRegister.initialAmount || 0) + (cashRegister.totalSales || 0)))
                            )}
                          </p>
                          <button
                            onClick={() => viewCashDetails(cashRegister)}
                            className="btn btn-secondary btn-sm mt-2 flex items-center justify-center gap-2"
                          >
                            <Eye className="w-3 h-3" />
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCashHistory(false)}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Vendas do Dia */}
      {showTodaySales && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Vendas do Caixa Atual</h3>
              <button
                onClick={() => setShowTodaySales(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingTodaySales ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma venda realizada neste caixa
                  </div>
                ) : (
                  <>
                    {/* Resumo do Dia */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total de Vendas</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(todaySales.reduce((sum, sale) => sum + sale.total, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quantidade</p>
                          <p className="text-xl font-bold">{todaySales.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ticket Médio</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(todaySales.length > 0 ? todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length : 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Vendas */}
                    <div className="space-y-2">
                      {todaySales.map((sale) => (
                        <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">Venda #{sale.saleNumber}</h4>
                              <p className="text-sm text-gray-600">
                                {sale.date} • {sale.time}
                              </p>
                              <p className="text-sm text-gray-600">
                                Cliente: {sale.customer || 'CONSUMIDOR'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Total:</p>
                              <p className="font-bold text-green-600">{formatCurrency(sale.total)}</p>
                            </div>
                          </div>
                          <div className="border-t pt-2">
                            <div className="mb-2">
                              <span className="text-sm font-medium">Itens ({sale.itemsCount}):</span>
                              <div className="mt-1 space-y-1">
                                {sale.items.length > 0 ? (
                                  sale.items.map((item, index) => (
                                    <div key={index} className="text-xs text-gray-600 ml-2">
                                      {item.quantity}x {item.description || item.product} - {formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-500 ml-2">Nenhum item encontrado</div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Formas Pgto:</span>
                              <span>
                                {sale.paymentMethods.map(payment => payment.method).join(', ') || 'Nenhuma'}
                              </span>
                            </div>
                            
                            {/* Botões de Ação */}
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                              <button
                                onClick={() => handlePrintSaleReceipt(sale)}
                                className="btn btn-secondary btn-sm flex items-center gap-1"
                                title="Imprimir comprovante"
                              >
                                <Printer className="w-3 h-3" />
                                Imprimir
                              </button>
                              <button
                                onClick={() => handleEditSale(sale)}
                                className="btn btn-primary btn-sm flex items-center gap-1"
                                title="Alterar venda"
                              >
                                <Edit className="w-3 h-3" />
                                Alterar
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale)}
                                className="btn btn-danger btn-sm flex items-center gap-1"
                                title="Excluir venda"
                              >
                                <Trash2 className="w-3 h-3" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTodaySales(false)}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Configurações da Impressora */}
      {showPrinterSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Configurar Impressora</h3>
              <button
                onClick={() => setShowPrinterSettings(false)}
                className="btn btn-secondary p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Impressora Disponível</label>
                {loadingPrinters ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Buscando impressoras do Windows...</p>
                    <p className="text-xs text-gray-500 mt-1">Isso pode levar alguns segundos</p>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Selecione uma impressora</option>
                      {availablePrinters.map((printer) => (
                        <option key={printer.id} value={printer.id}>
                          {printer.name} {printer.isDefault && '(Padrão)'}
                        </option>
                      ))}
                    </select>
                    
                    {availablePrinters.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium mb-2">Impressoras Detectadas:</p>
                        <div className="space-y-1">
                          {availablePrinters.map((printer) => (
                            <div key={printer.id} className="text-xs flex justify-between">
                              <span className={printer.isDefault ? 'font-medium text-blue-600' : ''}>
                                {printer.name}
                              </span>
                              <span className="text-gray-500">
                                {printer.driver && `${printer.driver}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => getAvailablePrinters(true)}
                      className="btn btn-secondary btn-sm mt-2 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Atualizar Lista
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="mr-2"
                  />
                  <span>Imprimir automaticamente após visualizar</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Se ativado, pulará a pré-visualização e imprime diretamente
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPrinterSettings(false)}
                className="btn btn-secondary flex-1 py-2 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={savePrinterSettings}
                className="btn btn-primary flex-1 py-2 flex items-center justify-center gap-2"
                disabled={!selectedPrinter}
              >
                <Check className="w-4 h-4" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmação de Exclusão de Venda */}
      {showDeleteSaleDialog && saleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600">Confirmar Exclusão</h3>
              <button
                onClick={() => {
                  setShowDeleteSaleDialog(false);
                  setSaleToDelete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Tem certeza que deseja excluir esta venda?
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p><strong>Venda:</strong> #{saleToDelete.saleNumber}</p>
                <p><strong>Cliente:</strong> {saleToDelete.customer || 'CONSUMIDOR'}</p>
                <p><strong>Total:</strong> {formatCurrency(saleToDelete.total)}</p>
                <p><strong>Data:</strong> {saleToDelete.date} • {saleToDelete.time}</p>
              </div>
              <p className="text-red-600 text-sm mt-3">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteSaleDialog(false);
                  setSaleToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteSale}
                className="btn btn-danger"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
